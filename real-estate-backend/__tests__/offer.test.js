const offerService = require("../src/services/offerService");
const Offer = require("../src/models/offerModel");
const Property = require("../src/models/propertyModel");
const AppError = require("../src/utils/appError");

jest.mock("../src/models/offerModel");
jest.mock("../src/models/propertyModel");

describe("Offer Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getOffers", () => {
    it("should get offers for buyer", async () => {
      const user = { id: "buyer123", role: "buyer" };
      const mockOffers = [{ _id: "offer1", buyer: user.id, property: "prop1" }];

      const mockQueryChain = {
        filter: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limitFields: jest.fn().mockReturnThis(),
        paginate: jest.fn().mockReturnThis(),
      };

      Offer.find = jest.fn().mockReturnValue(mockQueryChain);
    });
  });

  describe("getOfferById", () => {
    it("should get offer by ID for authorized user", async () => {
      const offerId = "offer123";
      const user = { id: "buyer123", role: "buyer" };

      const mockOffer = {
        _id: offerId,
        buyer: { _id: user.id },
        property: { title: "Property" },
      };

      Offer.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockOffer),
      });

      const result = await offerService.getOfferById(offerId, user);

      expect(result._id).toBe(offerId);
    });

    it("should throw error if offer not found", async () => {
      Offer.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      const user = { id: "buyer123", role: "buyer" };

      await expect(offerService.getOfferById("notfound", user)).rejects.toThrow(
        "Offer not found",
      );
    });

    it("should throw error if buyer tries to access other buyer offer", async () => {
      const offerId = "offer123";
      const user = { id: "buyer123", role: "buyer" };

      const mockOffer = {
        _id: offerId,
        buyer: { _id: "otherBuyer" },
      };

      Offer.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockOffer),
      });

      await expect(offerService.getOfferById(offerId, user)).rejects.toThrow(
        "You are not authorized to access this offer",
      );
    });
  });

  describe("createOffer", () => {
    it("should create offer if user is not property owner", async () => {
      const userId = "buyer123";
      const offerData = {
        property: "prop123",
        amount: 200000,
      };

      const mockProperty = {
        _id: "prop123",
        owner: "seller123", 
        price: 250000,
      };

      const mockOffer = {
        _id: "offer123",
        ...offerData,
        buyer: userId,
        expiresAt: expect.any(Date),
      };

      Property.findById = jest.fn().mockResolvedValue(mockProperty);
      Offer.findOne = jest.fn().mockResolvedValue(null);
      Offer.create = jest.fn().mockResolvedValue(mockOffer);
      Offer.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockOffer),
      });

      const result = await offerService.createOffer(offerData, userId);

      expect(result.buyer).toBe(userId);
      expect(Offer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          buyer: userId,
          expiresAt: expect.any(Date),
        }),
      );
    });

    it("should throw error if user is property owner", async () => {
      const userId = "seller123";
      const offerData = {
        property: "prop123",
        amount: 200000,
      };

      const mockProperty = {
        _id: "prop123",
        owner: userId, 
        price: 250000,
      };

      Property.findById = jest.fn().mockResolvedValue(mockProperty);

      await expect(offerService.createOffer(offerData, userId)).rejects.toThrow(
        "You cannot make an offer on your own property",
      );
    });

    it("should throw error if pending offer already exists", async () => {
      const userId = "buyer123";
      const offerData = {
        property: "prop123",
        amount: 200000,
      };

      const mockProperty = {
        _id: "prop123",
        owner: "seller123",
      };

      Property.findById = jest.fn().mockResolvedValue(mockProperty);
      Offer.findOne = jest.fn().mockResolvedValue({ _id: "existingOffer" });

      await expect(offerService.createOffer(offerData, userId)).rejects.toThrow(
        "You already have a pending offer for this property",
      );
    });

    it("should throw error if property not found", async () => {
      Property.findById = jest.fn().mockResolvedValue(null);

      await expect(
        offerService.createOffer(
          { property: "notfound", amount: 200000 },
          "buyer123",
        ),
      ).rejects.toThrow("Property not found");
    });
  });

  describe("updateOffer", () => {
    it("should update pending offer if user is buyer", async () => {
      const offerId = "offer123";
      const userId = "buyer123";
      const updateData = { amount: 210000 };

      const mockOffer = {
        _id: offerId,
        buyer: userId,
        status: "pending",
      };

      const mockUpdatedOffer = {
        ...mockOffer,
        ...updateData,
      };

      Offer.findById = jest.fn().mockResolvedValueOnce(mockOffer);
      Offer.findByIdAndUpdate = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUpdatedOffer),
      });

      const result = await offerService.updateOffer(
        offerId,
        updateData,
        userId,
      );

      expect(result.amount).toBe(210000);
    });

    it("should throw error if offer status is not pending", async () => {
      const offerId = "offer123";
      const userId = "buyer123";

      const mockOffer = {
        _id: offerId,
        buyer: userId,
        status: "accepted",
      };

      Offer.findById = jest.fn().mockResolvedValue(mockOffer);

      await expect(
        offerService.updateOffer(offerId, { amount: 210000 }, userId),
      ).rejects.toThrow("You can only update pending offers");
    });
  });

  describe("deleteOffer", () => {
    it("should soft delete offer if user is buyer", async () => {
      const offerId = "offer123";
      const userId = "buyer123";

      const mockOffer = {
        _id: offerId,
        buyer: userId,
      };

      Offer.findById = jest.fn().mockResolvedValue(mockOffer);
      Offer.findByIdAndUpdate = jest
        .fn()
        .mockResolvedValue({ isDeleted: true });

      await offerService.deleteOffer(offerId, userId);

      expect(Offer.findByIdAndUpdate).toHaveBeenCalledWith(
        offerId,
        expect.objectContaining({
          isDeleted: true,
        }),
      );
    });

    it("should throw error if not buyer", async () => {
      const offerId = "offer123";
      const userId = "buyer123";

      const mockOffer = {
        _id: offerId,
        buyer: "otherBuyer",
      };

      Offer.findById = jest.fn().mockResolvedValue(mockOffer);

      await expect(offerService.deleteOffer(offerId, userId)).rejects.toThrow(
        "You are not authorized to delete this offer",
      );
    });
  });

  describe("acceptOffer", () => {
    it("should accept pending offer if user is property owner", async () => {
      const offerId = "offer123";
      const propertyOwnerId = "seller123";

      const mockOffer = {
        _id: offerId,
        property: { owner: propertyOwnerId, _id: "prop123" },
        status: "pending",
        buyer: "buyer123",
      };

      const mockUpdatedOffer = {
        ...mockOffer,
        status: "accepted",
      };

      Offer.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockOffer),
      });
      Offer.findByIdAndUpdate = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUpdatedOffer),
      });
      Offer.updateMany = jest.fn().mockResolvedValue({});

      const result = await offerService.acceptOffer(offerId, propertyOwnerId);

      expect(result.status).toBe("accepted");
      expect(Offer.updateMany).toHaveBeenCalled(); 
    });

    it("should throw error if not property owner", async () => {
      const offerId = "offer123";
      const userId = "buyer123";

      const mockOffer = {
        _id: offerId,
        property: { owner: "seller123" },
      };

      Offer.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockOffer),
      });

      await expect(offerService.acceptOffer(offerId, userId)).rejects.toThrow(
        "You are not authorized to accept this offer",
      );
    });
  });

  describe("rejectOffer", () => {
    it("should reject pending offer if user is property owner", async () => {
      const offerId = "offer123";
      const propertyOwnerId = "seller123";

      const mockOffer = {
        _id: offerId,
        property: { owner: propertyOwnerId },
        status: "pending",
      };

      const mockRejectedOffer = {
        ...mockOffer,
        status: "rejected",
      };

      Offer.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockOffer),
      });
      Offer.findByIdAndUpdate = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockRejectedOffer),
      });

      const result = await offerService.rejectOffer(offerId, propertyOwnerId);

      expect(result.status).toBe("rejected");
    });

    it("should throw error if not property owner", async () => {
      const offerId = "offer123";
      const userId = "buyer123";

      const mockOffer = {
        _id: offerId,
        property: { owner: "seller123" },
      };

      Offer.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockOffer),
      });

      await expect(offerService.rejectOffer(offerId, userId)).rejects.toThrow(
        "You are not authorized to reject this offer",
      );
    });
  });
});
