const notificationService = require("../src/services/notificationService");
const Notification = require("../src/models/notificationModel");
const AppError = require("../src/utils/appError");

jest.mock("../src/models/notificationModel");

describe("Notification Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getNotifications", () => {
    it("should get notifications for authenticated user", async () => {
      const user = { id: "user123", role: "buyer" };

      Notification.find = jest.fn().mockReturnValue({
        filter: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limitFields: jest.fn().mockReturnThis(),
        paginate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue([]),
      });

    });

    it("should throw error if user not authenticated", async () => {
      const user = { id: null, role: null };

      await expect(
        notificationService.getNotifications({}, user),
      ).rejects.toThrow("Unauthorized");
    });
  });

  describe("getNotificationById", () => {
    it("should get notification if user is recipient", async () => {
      const notificationId = "notif123";
      const userId = "user123";

      const mockNotification = {
        _id: notificationId,
        recipient: { _id: userId },
        title: "New Offer",
        message: "You have a new offer",
      };

      Notification.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockNotification),
      });

      const result = await notificationService.getNotificationById(
        notificationId,
        userId,
      );

      expect(result._id).toBe(notificationId);
    });

    it("should throw error if notification not found", async () => {
      Notification.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(
        notificationService.getNotificationById("notfound", "user123"),
      ).rejects.toThrow("Notification not found");
    });

    it("should throw error if user is not recipient", async () => {
      const notificationId = "notif123";
      const userId = "user123";

      const mockNotification = {
        _id: notificationId,
        recipient: { _id: "otherUser" },
      };

      Notification.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockNotification),
      });

      await expect(
        notificationService.getNotificationById(notificationId, userId),
      ).rejects.toThrow("You are not authorized to access this notification");
    });
  });

  describe("createNotification", () => {
    it("should create notification", async () => {
      const notificationData = {
        recipient: "user123",
        type: "new_offer",
        title: "New Offer",
        message: "You have received a new offer",
        relatedEntity: { type: "offer", id: "offer123" },
      };

      const mockNotification = {
        _id: "notif123",
        ...notificationData,
        isRead: false,
      };

      Notification.create = jest.fn().mockResolvedValue(mockNotification);
      Notification.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockNotification),
      });

      const result =
        await notificationService.createNotification(notificationData);

      expect(result._id).toBeDefined();
      expect(result.title).toBe("New Offer");
      expect(Notification.create).toHaveBeenCalledWith(notificationData);
    });
  });

  describe("updateNotification", () => {
    it("should update notification if user is recipient", async () => {
      const notificationId = "notif123";
      const userId = "user123";
      const updateData = { isRead: true };

      const mockNotification = {
        _id: notificationId,
        recipient: userId,
        isRead: false,
      };

      const mockUpdatedNotification = {
        ...mockNotification,
        ...updateData,
      };

      Notification.findById = jest.fn().mockResolvedValueOnce(mockNotification);
      Notification.findByIdAndUpdate = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUpdatedNotification),
      });

      const result = await notificationService.updateNotification(
        notificationId,
        updateData,
        userId,
      );

      expect(result.isRead).toBe(true);
    });

    it("should throw error if not recipient", async () => {
      const notificationId = "notif123";
      const userId = "user123";

      const mockNotification = {
        _id: notificationId,
        recipient: "otherUser",
      };

      Notification.findById = jest.fn().mockResolvedValue(mockNotification);

      await expect(
        notificationService.updateNotification(notificationId, {}, userId),
      ).rejects.toThrow("You are not authorized to update this notification");
    });

    it("should throw error if notification not found", async () => {
      Notification.findById = jest.fn().mockResolvedValue(null);

      await expect(
        notificationService.updateNotification("notfound", {}, "user123"),
      ).rejects.toThrow("Notification not found");
    });
  });

  describe("deleteNotification", () => {
    it("should soft delete notification if user is recipient", async () => {
      const notificationId = "notif123";
      const userId = "user123";

      const mockNotification = {
        _id: notificationId,
        recipient: userId,
      };

      Notification.findById = jest.fn().mockResolvedValue(mockNotification);
      Notification.findByIdAndUpdate = jest
        .fn()
        .mockResolvedValue({ isDeleted: true });

      await notificationService.deleteNotification(notificationId, userId);

      expect(Notification.findByIdAndUpdate).toHaveBeenCalledWith(
        notificationId,
        expect.objectContaining({
          isDeleted: true,
        }),
      );
    });

    it("should throw error if not recipient", async () => {
      const notificationId = "notif123";
      const userId = "user123";

      const mockNotification = {
        _id: notificationId,
        recipient: "otherUser",
      };

      Notification.findById = jest.fn().mockResolvedValue(mockNotification);

      await expect(
        notificationService.deleteNotification(notificationId, userId),
      ).rejects.toThrow("You are not authorized to delete this notification");
    });
  });

  describe("getUserNotifications", () => {
    it("should get all user notifications", async () => {
      const userId = "user123";
      const mockNotifications = [
        { _id: "notif1", recipient: userId, type: "new_offer" },
        { _id: "notif2", recipient: userId, type: "booking_confirmed" },
      ];

      Notification.find = jest.fn().mockReturnValue({
        filter: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limitFields: jest.fn().mockReturnThis(),
        paginate: jest.fn().mockReturnThis(),
        query: Promise.resolve(mockNotifications),
      });

    });
  });

  describe("markAsRead", () => {
    it("should mark notification as read", async () => {
      const notificationId = "notif123";
      const userId = "user123";

      const mockNotification = {
        _id: notificationId,
        recipient: userId,
        isRead: false,
      };

      const mockReadNotification = {
        ...mockNotification,
        isRead: true,
      };

      Notification.findById = jest.fn().mockResolvedValue(mockNotification);
      Notification.findByIdAndUpdate = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockReadNotification),
      });

      const result = await notificationService.markAsRead(
        notificationId,
        userId,
      );

      expect(result.isRead).toBe(true);
      expect(Notification.findByIdAndUpdate).toHaveBeenCalledWith(
        notificationId,
        { isRead: true },
        {
          returnDocument: "after",
        },
      );
    });

    it("should throw error if user is not recipient", async () => {
      const notificationId = "notif123";
      const userId = "user123";

      const mockNotification = {
        _id: notificationId,
        recipient: "otherUser",
      };

      Notification.findById = jest.fn().mockResolvedValue(mockNotification);

      await expect(
        notificationService.markAsRead(notificationId, userId),
      ).rejects.toThrow("You are not authorized to update this notification");
    });
  });

  describe("markAllAsRead", () => {
    it("should mark all user notifications as read", async () => {
      const userId = "user123";

      Notification.updateMany = jest
        .fn()
        .mockResolvedValue({ modifiedCount: 5 });

      const result = await notificationService.markAllAsRead(userId);

      expect(Notification.updateMany).toHaveBeenCalledWith(
        { recipient: userId, isRead: false },
        { isRead: true },
      );
      expect(result.message).toBeDefined();
    });
  });

  describe("getUnreadCount", () => {
    it("should get unread notification count", async () => {
      const userId = "user123";

      Notification.countDocuments = jest.fn().mockResolvedValue(3);

      const result = await notificationService.getUnreadCount(userId);

      expect(result.unreadCount).toBe(3);
      expect(Notification.countDocuments).toHaveBeenCalledWith({
        recipient: userId,
        isRead: false,
        isDeleted: false,
      });
    });

    it("should return 0 if no unread notifications", async () => {
      const userId = "user123";

      Notification.countDocuments = jest.fn().mockResolvedValue(0);

      const result = await notificationService.getUnreadCount(userId);

      expect(result.unreadCount).toBe(0);
    });
  });

  describe("createNotificationForUser", () => {
    it("should create notification for user with all details", async () => {
      const recipientId = "user123";
      const type = "new_offer";
      const title = "New Offer";
      const message = "You have a new offer";
      const relatedEntity = { type: "offer", id: "offer123" };

      const mockNotification = {
        _id: "notif123",
        recipient: recipientId,
        type,
        title,
        message,
        relatedEntity,
      };

      Notification.create = jest.fn().mockResolvedValue(mockNotification);
      Notification.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockNotification),
      });

      const result = await notificationService.createNotificationForUser(
        recipientId,
        type,
        title,
        message,
        relatedEntity,
      );

      expect(result._id).toBeDefined();
      expect(result.type).toBe(type);
      expect(result.title).toBe(title);
    });

    it("should create notification without relatedEntity", async () => {
      const recipientId = "user123";
      const type = "system_announcement";
      const title = "System Update";
      const message = "System maintenance scheduled";

      const mockNotification = {
        _id: "notif123",
        recipient: recipientId,
        type,
        title,
        message,
        relatedEntity: null,
      };

      Notification.create = jest.fn().mockResolvedValue(mockNotification);
      Notification.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockNotification),
      });

      const result = await notificationService.createNotificationForUser(
        recipientId,
        type,
        title,
        message,
      );

      expect(result.relatedEntity).toBeNull();
    });
  });
});
