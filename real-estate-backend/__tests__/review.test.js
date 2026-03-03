const reviewService = require("../src/services/reviewService");
const Review = require("../src/models/reviewModel");
const Property = require("../src/models/propertyModel");
const AppError = require("../src/utils/appError");

jest.mock("../src/models/reviewModel");
jest.mock("../src/models/propertyModel");

describe("Review Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getReviews", () => {
    it("should get reviews for buyer user", async () => {
      const user = { id: "buyer123", role: "buyer" };

      Review.find = jest.fn().mockReturnValue({
        filter: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limitFields: jest.fn().mockReturnThis(),
        paginate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue([]),
      });

    });

    it("should throw error if user not authenticated", async () => {
      const user = { id: null, role: null };

      await expect(reviewService.getReviews({}, user)).rejects.toThrow(
        "Unauthorized",
      );
    });
  });

  describe("getReviewById", () => {
    it("should get review if user is authorized", async () => {
      const reviewId = "review123";
      const user = { id: "buyer123", role: "buyer" };

      const mockReview = {
        _id: reviewId,
        user: { _id: user.id },
        property: { title: "Property" },
      };

      Review.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockReview),
      });

      const result = await reviewService.getReviewById(reviewId, user);

      expect(result._id).toBe(reviewId);
    });

    it("should throw error if review not found", async () => {
      Review.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      const user = { id: "buyer123", role: "buyer" };

      await expect(
        reviewService.getReviewById("notfound", user),
      ).rejects.toThrow("Review not found");
    });
  });

  describe("createReview", () => {
    it("should create review if user is not property owner", async () => {
      const userId = "buyer123";
      const reviewData = {
        property: "prop123",
        rating: 4,
        comment: "Great property!",
      };

      const mockProperty = {
        _id: "prop123",
        owner: "seller123",
      };

      const mockReview = {
        _id: "review123",
        ...reviewData,
        user: userId,
      };

      Property.findById = jest.fn().mockResolvedValue(mockProperty);
      Review.findOne = jest.fn().mockResolvedValue(null);
      Review.create = jest.fn().mockResolvedValue(mockReview);
      Review.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockReview),
      });
      Review.aggregate = jest.fn().mockResolvedValue([
        {
          _id: "prop123",
          avgRating: 4,
          ratingsCount: 1,
        },
      ]);
      Property.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      const result = await reviewService.createReview(reviewData, userId);

      expect(result.user).toBe(userId);
      expect(Property.findByIdAndUpdate).toHaveBeenCalled(); 
    });

    it("should throw error if property owner reviews own property", async () => {
      const userId = "seller123";
      const reviewData = {
        property: "prop123",
        rating: 4,
        comment: "Great property!",
      };

      const mockProperty = {
        _id: "prop123",
        owner: userId,
      };

      Property.findById = jest.fn().mockResolvedValue(mockProperty);

      await expect(
        reviewService.createReview(reviewData, userId),
      ).rejects.toThrow("You cannot review your own property");
    });

    it("should throw error if user already reviewed property", async () => {
      const userId = "buyer123";
      const reviewData = {
        property: "prop123",
        rating: 4,
        comment: "Great property!",
      };

      const mockProperty = {
        _id: "prop123",
        owner: "seller123",
      };

      Property.findById = jest.fn().mockResolvedValue(mockProperty);
      Review.findOne = jest.fn().mockResolvedValue({ _id: "existingReview" });

      await expect(
        reviewService.createReview(reviewData, userId),
      ).rejects.toThrow("You have already reviewed this property");
    });

    it("should throw error if property not found", async () => {
      Property.findById = jest.fn().mockResolvedValue(null);

      await expect(
        reviewService.createReview(
          { property: "notfound", rating: 4 },
          "user123",
        ),
      ).rejects.toThrow("Property not found");
    });
  });

  describe("updateReview", () => {
    it("should update review if user is author", async () => {
      const reviewId = "review123";
      const userId = "buyer123";
      const updateData = { rating: 5, comment: "Updated comment" };

      const mockReview = {
        _id: reviewId,
        user: userId,
        property: "prop123",
      };

      const mockUpdatedReview = {
        ...mockReview,
        ...updateData,
      };

      Review.findById = jest.fn().mockResolvedValueOnce(mockReview);
      Review.findByIdAndUpdate = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUpdatedReview),
      });
      Review.aggregate = jest.fn().mockResolvedValue([
        {
          _id: "prop123",
          avgRating: 5,
          ratingsCount: 1,
        },
      ]);
      Property.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      const result = await reviewService.updateReview(
        reviewId,
        updateData,
        userId,
      );

      expect(result.rating).toBe(5);
      expect(Property.findByIdAndUpdate).toHaveBeenCalled(); 
    });

    it("should throw error if not author", async () => {
      const reviewId = "review123";
      const userId = "buyer123";

      const mockReview = {
        _id: reviewId,
        user: "otherUser",
      };

      Review.findById = jest.fn().mockResolvedValue(mockReview);

      await expect(
        reviewService.updateReview(reviewId, {}, userId),
      ).rejects.toThrow("You are not authorized to update this review");
    });
  });

  describe("deleteReview", () => {
    it("should soft delete review if user is author", async () => {
      const reviewId = "review123";
      const userId = "buyer123";

      const mockReview = {
        _id: reviewId,
        user: userId,
        property: "prop123",
      };

      Review.findById = jest.fn().mockResolvedValue(mockReview);
      Review.findByIdAndUpdate = jest
        .fn()
        .mockResolvedValue({ isDeleted: true });
      Review.aggregate = jest.fn().mockResolvedValue([
        {
          _id: "prop123",
          avgRating: 0,
          ratingsCount: 0,
        },
      ]);
      Property.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      await reviewService.deleteReview(reviewId, userId);

      expect(Review.findByIdAndUpdate).toHaveBeenCalledWith(
        reviewId,
        expect.objectContaining({
          isDeleted: true,
        }),
      );
      expect(Property.findByIdAndUpdate).toHaveBeenCalled(); 
    });

    it("should throw error if not author", async () => {
      const reviewId = "review123";
      const userId = "buyer123";

      const mockReview = {
        _id: reviewId,
        user: "otherUser",
      };

      Review.findById = jest.fn().mockResolvedValue(mockReview);

      await expect(
        reviewService.deleteReview(reviewId, userId),
      ).rejects.toThrow("You are not authorized to delete this review");
    });
  });

  describe("updatePropertyRatings", () => {
    it("should update property ratings after review change", async () => {
      const propertyId = "prop123";

      Review.aggregate = jest.fn().mockResolvedValue([
        {
          _id: propertyId,
          avgRating: 4.5,
          ratingsCount: 10,
        },
      ]);

      Property.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      await reviewService.updatePropertyRatings(propertyId);

      expect(Property.findByIdAndUpdate).toHaveBeenCalledWith(propertyId, {
        averageRating: 4.5,
        ratingsCount: 10,
      });
    });

    it("should reset ratings to 0 if no reviews", async () => {
      const propertyId = "prop123";

      Review.aggregate = jest.fn().mockResolvedValue([]);

      Property.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      await reviewService.updatePropertyRatings(propertyId);

      expect(Property.findByIdAndUpdate).toHaveBeenCalledWith(propertyId, {
        averageRating: 0,
        ratingsCount: 0,
      });
    });
  });

  describe("getPropertyReviews", () => {
    it("should get all reviews for property", async () => {
      const propertyId = "prop123";
      const mockReviews = [
        { _id: "review1", property: propertyId, rating: 5 },
        { _id: "review2", property: propertyId, rating: 4 },
      ];

      Review.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockReviews),
        }),
      });

      const result = await reviewService.getPropertyReviews(propertyId);

      expect(result).toEqual(mockReviews);
    });
  });
});
