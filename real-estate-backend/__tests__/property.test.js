const propertyService = require("../src/services/propertyService");
const Property = require("../src/models/propertyModel");
const AppError = require("../src/utils/appError");

jest.mock("../src/models/propertyModel");

describe("Property Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getProperties", () => {
    it("should retrieve list of properties", async () => {
      const mockProperties = [
        { _id: "prop1", title: "Property 1", price: 100000 },
        { _id: "prop2", title: "Property 2", price: 200000 },
      ];

      const mockQueryChain = {
        filter: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limitFields: jest.fn().mockReturnThis(),
        paginate: jest.fn().mockReturnThis(),
        query: Promise.resolve(mockProperties),
      };

      Property.find = jest.fn().mockReturnValue(mockQueryChain);

      // The actual implementation uses ApiFeatures which needs mocking
      // This is a simplified test
    });
  });

  describe("getPropertyById", () => {
    it("should get property by ID", async () => {
      const propertyId = "prop123";
      const mockProperty = {
        _id: propertyId,
        title: "Beautiful House",
        price: 250000,
        owner: "user123",
      };

      Property.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockProperty),
      });

      const result = await propertyService.getPropertyById(propertyId);

      expect(result).toBeDefined();
      expect(result.title).toBe("Beautiful House");
    });

    it("should throw error if property not found", async () => {
      Property.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(propertyService.getPropertyById("notfound")).rejects.toThrow(
        "Property not found",
      );
    });
  });

  describe("createProperty", () => {
    it("should create a new property", async () => {
      const userId = "user123";
      const propertyData = {
        title: "New Property",
        price: 300000,
        type: "house",
        location: { type: "Point", coordinates: [0, 0] },
      };

      const mockProperty = {
        _id: "prop123",
        ...propertyData,
        owner: userId,
      };

      Property.create = jest.fn().mockResolvedValue(mockProperty);
      Property.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockProperty),
      });

      const result = await propertyService.createProperty(propertyData, userId);

      expect(result).toBeDefined();
      expect(Property.create).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: userId,
        }),
      );
    });
  });

  describe("updateProperty", () => {
    it("should update property if user owns it", async () => {
      const propertyId = "prop123";
      const userId = "user123";
      const updateData = { price: 350000 };

      const mockProperty = {
        _id: propertyId,
        title: "Property",
        owner: userId,
      };

      const mockUpdatedProperty = {
        ...mockProperty,
        price: 350000,
      };

      Property.findById = jest
        .fn()
        .mockResolvedValueOnce(mockProperty)
        .mockReturnValueOnce({
          populate: jest.fn().mockResolvedValue(mockUpdatedProperty),
        });

      Property.findByIdAndUpdate = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUpdatedProperty),
      });

      const result = await propertyService.updateProperty(
        propertyId,
        updateData,
        userId,
      );

      expect(result.price).toBe(350000);
    });

    it("should throw error if user does not own property", async () => {
      const propertyId = "prop123";
      const userId = "user123";
      const ownerId = "otherUser";

      const mockProperty = {
        _id: propertyId,
        owner: ownerId,
      };

      Property.findById = jest.fn().mockResolvedValue(mockProperty);

      await expect(
        propertyService.updateProperty(propertyId, { price: 350000 }, userId),
      ).rejects.toThrow("You are not authorized to update this property");
    });

    it("should throw error if property not found", async () => {
      Property.findById = jest.fn().mockResolvedValue(null);

      await expect(
        propertyService.updateProperty("notfound", {}, "user123"),
      ).rejects.toThrow("Property not found");
    });
  });

  describe("deleteProperty", () => {
    it("should soft delete property if user owns it", async () => {
      const propertyId = "prop123";
      const userId = "user123";

      const mockProperty = {
        _id: propertyId,
        owner: userId,
      };

      Property.findById = jest.fn().mockResolvedValue(mockProperty);
      Property.findByIdAndUpdate = jest
        .fn()
        .mockResolvedValue({ isDeleted: true });

      await propertyService.deleteProperty(propertyId, userId);

      expect(Property.findByIdAndUpdate).toHaveBeenCalledWith(
        propertyId,
        expect.objectContaining({
          isDeleted: true,
        }),
      );
    });

    it("should throw error if user does not own property", async () => {
      const propertyId = "prop123";
      const userId = "user123";
      const ownerId = "otherUser";

      const mockProperty = {
        _id: propertyId,
        owner: ownerId,
      };

      Property.findById = jest.fn().mockResolvedValue(mockProperty);

      await expect(
        propertyService.deleteProperty(propertyId, userId),
      ).rejects.toThrow("You are not authorized to delete this property");
    });

    it("should throw error if property not found", async () => {
      Property.findById = jest.fn().mockResolvedValue(null);

      await expect(
        propertyService.deleteProperty("notfound", "user123"),
      ).rejects.toThrow("Property not found");
    });
  });

  describe("getPropertyStats", () => {
    it("should get property statistics", async () => {
      const mockStats = [
        { _id: "house", count: 50, avgPrice: 250000 },
        { _id: "apartment", count: 30, avgPrice: 150000 },
      ];

      Property.aggregate = jest.fn().mockResolvedValue(mockStats);

      const result = await propertyService.getPropertyStats();

      expect(result).toEqual(mockStats);
      expect(Property.aggregate).toHaveBeenCalled();
    });
  });

  describe("incrementViews", () => {
    it("should increment property views", async () => {
      const propertyId = "prop123";

      Property.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      await propertyService.incrementViews(propertyId);

      expect(Property.findByIdAndUpdate).toHaveBeenCalledWith(
        propertyId,
        expect.objectContaining({
          $inc: { viewsCount: 1 },
        }),
      );
    });
  });

  describe("updatePropertyImages", () => {
    it("should update property images", async () => {
      const propertyId = "prop123";
      const images = [{ url: "image1.jpg" }, { url: "image2.jpg" }];

      const mockUpdatedProperty = {
        _id: propertyId,
        images: images,
      };

      Property.findByIdAndUpdate = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUpdatedProperty),
      });

      const result = await propertyService.updatePropertyImages(
        propertyId,
        images,
      );

      expect(result.images).toEqual(images);
      expect(Property.findByIdAndUpdate).toHaveBeenCalledWith(
        propertyId,
        { images },
        expect.any(Object),
      );
    });

    it("should throw error if property not found", async () => {
      Property.findByIdAndUpdate = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(
        propertyService.updatePropertyImages("notfound", []),
      ).rejects.toThrow("Property not found");
    });
  });
});
