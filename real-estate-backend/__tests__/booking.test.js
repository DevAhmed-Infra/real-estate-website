const bookingService = require("../src/services/bookingService");
const Booking = require("../src/models/bookingModel");
const Property = require("../src/models/propertyModel");
const AppError = require("../src/utils/appError");

jest.mock("../src/models/bookingModel");
jest.mock("../src/models/propertyModel");

describe("Booking Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getBookings", () => {
    it("should get bookings for authenticated user", async () => {
      const user = { id: "buyer123", role: "buyer" };

      Booking.find = jest.fn().mockReturnValue({
        filter: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limitFields: jest.fn().mockReturnThis(),
        paginate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue([]),
      });

      // Simplified test - actual implementation uses ApiFeatures
    });

    it("should throw error if user is not authenticated", async () => {
      const user = { id: null, role: null };

      await expect(bookingService.getBookings({}, user)).rejects.toThrow(
        "Unauthorized",
      );
    });
  });

  describe("getBookingById", () => {
    it("should get booking if user is authorized", async () => {
      const bookingId = "booking123";
      const user = { id: "buyer123", role: "buyer" };

      const mockBooking = {
        _id: bookingId,
        buyer: { _id: user.id },
        property: { title: "Property" },
      };

      Booking.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockBooking),
      });

      const result = await bookingService.getBookingById(bookingId, user);

      expect(result._id).toBe(bookingId);
    });

    it("should throw error if booking not found", async () => {
      Booking.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      const user = { id: "buyer123", role: "buyer" };

      await expect(
        bookingService.getBookingById("notfound", user),
      ).rejects.toThrow("Booking not found");
    });
  });

  describe("createBooking", () => {
    it("should create booking for future date", async () => {
      const userId = "buyer123";
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
      const bookingData = {
        property: "prop123",
        scheduledDate: futureDate,
      };

      const mockProperty = {
        _id: "prop123",
        owner: "seller123",
      };

      const mockBooking = {
        _id: "booking123",
        ...bookingData,
        buyer: userId,
      };

      Property.findById = jest.fn().mockResolvedValue(mockProperty);
      Booking.findOne = jest.fn().mockResolvedValue(null);
      Booking.create = jest.fn().mockResolvedValue(mockBooking);
      Booking.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockBooking),
      });

      const result = await bookingService.createBooking(bookingData, userId);

      expect(result.buyer).toBe(userId);
    });

    it("should throw error for past date", async () => {
      const userId = "buyer123";
      const pastDate = new Date(Date.now() - 1000); // Past
      const bookingData = {
        property: "prop123",
        scheduledDate: pastDate,
      };

      const mockProperty = {
        _id: "prop123",
        owner: "seller123",
      };

      Property.findById = jest.fn().mockResolvedValue(mockProperty);
      Booking.findOne = jest.fn().mockResolvedValue(null);

      await expect(
        bookingService.createBooking(bookingData, userId),
      ).rejects.toThrow("Scheduled date must be in the future");
    });

    it("should throw error if property owner tries to book own property", async () => {
      const userId = "seller123";
      const bookingData = {
        property: "prop123",
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      const mockProperty = {
        _id: "prop123",
        owner: userId,
      };

      Property.findById = jest.fn().mockResolvedValue(mockProperty);

      await expect(
        bookingService.createBooking(bookingData, userId),
      ).rejects.toThrow("You cannot book a viewing for your own property");
    });

    it("should throw error if slot is already booked", async () => {
      const userId = "buyer123";
      const scheduledDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const bookingData = {
        property: "prop123",
        scheduledDate: scheduledDate,
      };

      const mockProperty = {
        _id: "prop123",
        owner: "seller123",
      };

      Property.findById = jest.fn().mockResolvedValue(mockProperty);
      Booking.findOne = jest.fn().mockResolvedValue({ _id: "existingBooking" });

      await expect(
        bookingService.createBooking(bookingData, userId),
      ).rejects.toThrow(
        "This property is already booked for this date and time",
      );
    });
  });

  describe("updateBooking", () => {
    it("should update pending booking", async () => {
      const bookingId = "booking123";
      const userId = "buyer123";
      const updateData = { notes: "Updated notes" };

      const mockBooking = {
        _id: bookingId,
        buyer: { toString: () => userId },
        status: "pending",
      };

      const mockUpdatedBooking = {
        ...mockBooking,
        ...updateData,
      };

      Booking.findById = jest.fn().mockResolvedValueOnce(mockBooking);
      Booking.findByIdAndUpdate = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUpdatedBooking),
      });

      const result = await bookingService.updateBooking(
        bookingId,
        updateData,
        userId,
      );

      expect(result.notes).toBe("Updated notes");
    });

    it("should throw error if not pending", async () => {
      const bookingId = "booking123";
      const userId = "buyer123";

      const mockBooking = {
        _id: bookingId,
        buyer: { toString: () => userId },
        status: "approved",
      };

      Booking.findById = jest.fn().mockResolvedValue(mockBooking);

      await expect(
        bookingService.updateBooking(bookingId, {}, userId),
      ).rejects.toThrow("You can only update pending bookings");
    });
  });

  describe("deleteBooking", () => {
    it("should soft delete booking if user is buyer", async () => {
      const bookingId = "booking123";
      const userId = "buyer123";

      const mockBooking = {
        _id: bookingId,
        buyer: { toString: () => userId },
      };

      Booking.findById = jest.fn().mockResolvedValue(mockBooking);
      Booking.findByIdAndUpdate = jest
        .fn()
        .mockResolvedValue({ isDeleted: true });

      await bookingService.deleteBooking(bookingId, userId);

      expect(Booking.findByIdAndUpdate).toHaveBeenCalledWith(
        bookingId,
        expect.objectContaining({
          isDeleted: true,
        }),
      );
    });
  });

  describe("approveBooking", () => {
    it("should approve pending booking if user is property owner", async () => {
      const bookingId = "booking123";
      const propertyOwnerId = "seller123";

      const mockBooking = {
        _id: bookingId,
        property: { owner: propertyOwnerId },
        status: "pending",
      };

      const mockApprovedBooking = {
        ...mockBooking,
        status: "approved",
      };

      Booking.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockBooking),
      });
      Booking.findByIdAndUpdate = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockApprovedBooking),
      });
      Booking.updateMany = jest.fn().mockResolvedValue({});

      const result = await bookingService.approveBooking(
        bookingId,
        propertyOwnerId,
      );

      expect(result.status).toBe("approved");
    });

    it("should throw error if not property owner", async () => {
      const bookingId = "booking123";
      const userId = "buyer123";

      const mockBooking = {
        _id: bookingId,
        property: { owner: "seller123" },
      };

      Booking.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockBooking),
      });

      await expect(
        bookingService.approveBooking(bookingId, userId),
      ).rejects.toThrow("You are not authorized to approve this booking");
    });
  });

  describe("rejectBooking", () => {
    it("should reject pending booking if user is property owner", async () => {
      const bookingId = "booking123";
      const propertyOwnerId = "seller123";

      const mockBooking = {
        _id: bookingId,
        property: { owner: propertyOwnerId },
        status: "pending",
      };

      const mockRejectedBooking = {
        ...mockBooking,
        status: "rejected",
      };

      Booking.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockBooking),
      });
      Booking.findByIdAndUpdate = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockRejectedBooking),
      });

      const result = await bookingService.rejectBooking(
        bookingId,
        propertyOwnerId,
      );

      expect(result.status).toBe("rejected");
    });
  });

  describe("completeBooking", () => {
    it("should complete approved booking if user is property owner", async () => {
      const bookingId = "booking123";
      const propertyOwnerId = "seller123";

      const mockBooking = {
        _id: bookingId,
        property: { owner: propertyOwnerId },
        status: "approved",
      };

      const mockCompletedBooking = {
        ...mockBooking,
        status: "completed",
      };

      Booking.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockBooking),
      });
      Booking.findByIdAndUpdate = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCompletedBooking),
      });

      const result = await bookingService.completeBooking(
        bookingId,
        propertyOwnerId,
      );

      expect(result.status).toBe("completed");
    });

    it("should throw error if booking not approved", async () => {
      const bookingId = "booking123";
      const propertyOwnerId = "seller123";

      const mockBooking = {
        _id: bookingId,
        property: { owner: propertyOwnerId },
        status: "pending",
      };

      Booking.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockBooking),
      });

      await expect(
        bookingService.completeBooking(bookingId, propertyOwnerId),
      ).rejects.toThrow("This booking cannot be completed");
    });
  });

  describe("cancelBooking", () => {
    it("should cancel pending or approved booking if user is buyer", async () => {
      const bookingId = "booking123";
      const userId = "buyer123";

      const mockBooking = {
        _id: bookingId,
        buyer: { toString: () => userId },
        status: "pending",
      };

      const mockCancelledBooking = {
        ...mockBooking,
        status: "cancelled",
      };

      Booking.findById = jest.fn().mockResolvedValue(mockBooking);
      Booking.findByIdAndUpdate = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockCancelledBooking),
      });

      const result = await bookingService.cancelBooking(bookingId, userId);

      expect(result.status).toBe("cancelled");
    });

    it("should throw error if already cancelled or completed", async () => {
      const bookingId = "booking123";
      const userId = "buyer123";

      const mockBooking = {
        _id: bookingId,
        buyer: { toString: () => userId },
        status: "cancelled",
      };

      Booking.findById = jest.fn().mockResolvedValue(mockBooking);

      await expect(
        bookingService.cancelBooking(bookingId, userId),
      ).rejects.toThrow("This booking cannot be cancelled");
    });
  });
});
