import { DataTypes } from 'sequelize';
import sequelize from '../utils/database.js';

const ProductURL = sequelize.define(
    'ProductURL',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        domain: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        urls: {
            type: DataTypes.TEXT,
            allowNull: false,
            get() {
                const rawUrls = this.getDataValue('urls');
                return rawUrls ? rawUrls.split(',') : [];
            },
            set(value) {
                const urlsArray = Array.isArray(value) ? value : [value];
                this.setDataValue('urls', urlsArray.join(','));
            }
        },
        crawlingDate: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    },
    {
        tableName: 'product_urls',
        timestamps: false
    }
);

export default ProductURL;
