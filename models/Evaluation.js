const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Evaluation extends Model {}

  Evaluation.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      appointment_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'appointments', key: 'id' },
        onDelete: 'CASCADE',
      },
      patient_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      professional_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1, max: 5 },
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'Evaluation',
      tableName: 'evaluations',
      timestamps: true,
      underscored: true,
    }
  );

  return Evaluation;
};
