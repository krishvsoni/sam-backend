import mongoose from 'mongoose';
const connectToDB = async () => {
    try {
        await mongoose.connect("mongodb+srv://krishsoni:2203031050659@paytm.aujjoys.mongodb.net/SAM", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
            socketTimeoutMS: 45000,// Adjust socket timeout based on your needs
        });
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
};
// await mongoose.connect("mongodb+srv://Haard18:Haard1808@cluster0.zuniu39.mongodb.net/SAM", {

export default connectToDB;