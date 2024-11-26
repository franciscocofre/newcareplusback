const { DataTypes } = require("sequelize");
const sequelize = require("../config/config");

const Notification = sequelize.define(
  "Notification",
  {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
    tableName: "notifications",
  }
);

module.exports = Notification;
