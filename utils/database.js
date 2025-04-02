import { Sequelize } from 'sequelize'; // Use named import

// Create a new Sequelize instance
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false // Disable logging; set to true for debugging
    }
);

// Initialize database connection and sync models
export const initializeDatabase = async (models = []) => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
        
        // Sync all models with the database
        await sequelize.sync({ alter: true });
        console.log('Database models synchronized successfully.');
        
        return true;
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        throw error;
    }
};

export default sequelize;
