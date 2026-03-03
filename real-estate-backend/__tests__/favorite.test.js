const favoriteService = require("../src/services/favoriteService");
const Favorite = require("../src/models/favoriteModel");
const Property = require("../src/models/propertyModel");
const AppError = require("../src/utils/appError");

jest.mock("../src/models/favoriteModel");
jest.mock("../src/models/propertyModel");

describe("Favorite Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getFavorites", () => {
    it("should get favorites for buyer user", async () => {
      const user = { id: "buyer123", role: "buyer" };

      Favorite.find = jest.fn().mockReturnValue({
        filter: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limitFields: jest.fn().mockReturnThis(),
        paginate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue([]),
      });

    });

    it("should throw error if user not authenticated", async () => {
      const user = { id: null, role: null };

      await expect(favoriteService.getFavorites({}, user)).rejects.toThrow(
        "Unauthorized",
      );
    });
  });

  describe("getFavoriteById", () => {
    it("should get favorite if user is authorized", async () => {
      const favoriteId = "fav123";
      const user = { id: "buyer123", role: "buyer" };

      const mockFavorite = {
        _id: favoriteId,
        user: { _id: user.id },
        property: { title: "Property" },
      };

      Favorite.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockFavorite),
      });

      const result = await favoriteService.getFavoriteById(favoriteId, user);

      expect(result._id).toBe(favoriteId);
    });

    it("should throw error if favorite not found", async () => {
      Favorite.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      const user = { id: "buyer123", role: "buyer" };

      await expect(
        favoriteService.getFavoriteById("notfound", user),
      ).rejects.toThrow("Favorite not found");
    });
  });

  describe("addFavorite", () => {
    it("should add property to favorites", async () => {
      const userId = "buyer123";
      const propertyId = "prop123";

      const mockProperty = {
        _id: propertyId,
        owner: "seller123",
      };

      const mockFavorite = {
        _id: "fav123",
        user: userId,
        property: propertyId,
      };

      Property.findById = jest.fn().mockResolvedValue(mockProperty);
      Favorite.findOne = jest.fn().mockResolvedValue(null);
      Favorite.create = jest.fn().mockResolvedValue(mockFavorite);
      Favorite.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockFavorite),
      });
      Property.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      const result = await favoriteService.addFavorite(propertyId, userId);

      expect(result.user).toBe(userId);
      expect(Property.findByIdAndUpdate).toHaveBeenCalledWith(propertyId, {
        $inc: { favoritesCount: 1 },
      });
    });

    it("should throw error if user favorites own property", async () => {
      const userId = "seller123";
      const propertyId = "prop123";

      const mockProperty = {
        _id: propertyId,
        owner: userId,
      };

      Property.findById = jest.fn().mockResolvedValue(mockProperty);

      await expect(
        favoriteService.addFavorite(propertyId, userId),
      ).rejects.toThrow("You cannot favorite your own property");
    });

    it("should throw error if already favorited", async () => {
      const userId = "buyer123";
      const propertyId = "prop123";

      const mockProperty = {
        _id: propertyId,
        owner: "seller123",
      };

      Property.findById = jest.fn().mockResolvedValue(mockProperty);
      Favorite.findOne = jest.fn().mockResolvedValue({ _id: "existingFav" });

      await expect(
        favoriteService.addFavorite(propertyId, userId),
      ).rejects.toThrow("Property is already in your favorites");
    });

    it("should throw error if property not found", async () => {
      Property.findById = jest.fn().mockResolvedValue(null);

      await expect(
        favoriteService.addFavorite("notfound", "user123"),
      ).rejects.toThrow("Property not found");
    });
  });

  describe("removeFavorite", () => {
    it("should soft delete favorite", async () => {
      const userId = "buyer123";
      const propertyId = "prop123";

      const mockFavorite = {
        _id: "fav123",
        user: userId,
        property: propertyId,
      };

      Favorite.findOne = jest.fn().mockResolvedValue(mockFavorite);
      Favorite.findByIdAndUpdate = jest
        .fn()
        .mockResolvedValue({ isDeleted: true });
      Property.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      await favoriteService.removeFavorite(propertyId, userId);

      expect(Favorite.findByIdAndUpdate).toHaveBeenCalledWith(
        "fav123",
        expect.objectContaining({
          isDeleted: true,
        }),
      );
      expect(Property.findByIdAndUpdate).toHaveBeenCalledWith(propertyId, {
        $inc: { favoritesCount: -1 },
      });
    });

    it("should throw error if not favorited", async () => {
      const userId = "buyer123";
      const propertyId = "prop123";

      Favorite.findOne = jest.fn().mockResolvedValue(null);

      await expect(
        favoriteService.removeFavorite(propertyId, userId),
      ).rejects.toThrow("Favorite not found");
    });
  });

  describe("getUserFavorites", () => {
    it("should get all user favorites", async () => {
      const userId = "buyer123";
      const mockFavorites = [
        { _id: "fav1", user: userId, property: { title: "Property 1" } },
        { _id: "fav2", user: userId, property: { title: "Property 2" } },
      ];

      Favorite.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockFavorites),
        }),
      });

      const result = await favoriteService.getUserFavorites(userId);

      expect(result).toEqual(mockFavorites);
      expect(result.length).toBe(2);
    });
  });

  describe("isPropertyFavorited", () => {
    it("should return true if property is favorited", async () => {
      const userId = "buyer123";
      const propertyId = "prop123";

      Favorite.findOne = jest.fn().mockResolvedValue({ _id: "fav123" });

      const result = await favoriteService.isPropertyFavorited(
        propertyId,
        userId,
      );

      expect(result).toBe(true);
    });

    it("should return false if property is not favorited", async () => {
      const userId = "buyer123";
      const propertyId = "prop123";

      Favorite.findOne = jest.fn().mockResolvedValue(null);

      const result = await favoriteService.isPropertyFavorited(
        propertyId,
        userId,
      );

      expect(result).toBe(false);
    });
  });

  describe("deleteFavorite", () => {
    it("should soft delete favorite if user is owner", async () => {
      const favoriteId = "fav123";
      const userId = "buyer123";
      const propertyId = "prop123";

      const mockFavorite = {
        _id: favoriteId,
        user: userId,
        property: propertyId,
      };

      Favorite.findById = jest.fn().mockResolvedValue(mockFavorite);
      Favorite.findByIdAndUpdate = jest
        .fn()
        .mockResolvedValue({ isDeleted: true });
      Property.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      await favoriteService.deleteFavorite(favoriteId, userId);

      expect(Favorite.findByIdAndUpdate).toHaveBeenCalledWith(
        favoriteId,
        expect.objectContaining({
          isDeleted: true,
        }),
      );
      expect(Property.findByIdAndUpdate).toHaveBeenCalledWith(propertyId, {
        $inc: { favoritesCount: -1 },
      });
    });

    it("should throw error if not owner", async () => {
      const favoriteId = "fav123";
      const userId = "buyer123";

      const mockFavorite = {
        _id: favoriteId,
        user: "otherUser",
      };

      Favorite.findById = jest.fn().mockResolvedValue(mockFavorite);

      await expect(
        favoriteService.deleteFavorite(favoriteId, userId),
      ).rejects.toThrow("You are not authorized to delete this favorite");
    });

    it("should throw error if favorite not found", async () => {
      Favorite.findById = jest.fn().mockResolvedValue(null);

      await expect(
        favoriteService.deleteFavorite("notfound", "user123"),
      ).rejects.toThrow("Favorite not found");
    });
  });
});
