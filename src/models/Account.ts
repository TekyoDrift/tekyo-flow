import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config';
import { AccountRole } from '../types';

interface AccountAttributes {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  hashed_password: string;
  salt: string;
  role: AccountRole;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

interface AccountCreationAttributes
  extends Optional<AccountAttributes, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> {}

class Account extends Model<AccountAttributes, AccountCreationAttributes> implements AccountAttributes {
  declare id: number;
  declare firstname: string;
  declare lastname: string;
  declare email: string;
  declare hashed_password: string;
  declare salt: string;
  declare role: AccountRole;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
  declare readonly deleted_at: Date | null;
}

Account.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    firstname: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastname: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    hashed_password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    salt: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM(...Object.values(AccountRole)),
      allowNull: false,
      defaultValue: 'GUEST'
    }
  },
  {
    sequelize,
    modelName: 'Account',
    tableName: 'accounts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at',
    indexes: [
      {
        unique: true,
        fields: ['id']
      },
      {
        unique: true,
        fields: ['email']
      }
    ]
  }
);

export default Account;
