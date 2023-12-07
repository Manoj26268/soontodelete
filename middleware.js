const mongoose = require('mongoose');

const connectToDatabase = async () => {
  try {
    await mongoose.connect('mongodb+srv://manojanthati26:manoj268@cluster0.zxoafsd.mongodb.net/reviewhub?retryWrites=true&w=majority');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

const subcategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 10,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
});

const Subcategory = mongoose.model('Subcategory', subcategorySchema);

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 10,
  },
});

const Category = mongoose.model('Category', categorySchema);

// Hotel Model
const hotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

const Hotel = mongoose.model('Hotel', hotelSchema);

// Review Model
const reviewSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true,
  },
  platform: {
    type: String,
    required: true,
  },
  reviewText: {
    type: String,
    required: true,
  },
  response: {
    type: String,
    default: null,
  },
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: null,
  },
});

const Review = mongoose.model('Review', reviewSchema);








// Notification Model
const notificationSchema = new mongoose.Schema({
  content: { type: String, required: true },
});

const Notification = mongoose.model('Notification', notificationSchema);

// User Model
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  googleId: String,
 
});

const User = mongoose.model('User', userSchema);

module.exports = { connectToDatabase, User, Hotel, Category, Subcategory, Review, Notification  };
