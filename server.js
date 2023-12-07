const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const session = require('express-session');
const { User, Hotel, Category, Subcategory, Review, Notification  } = require('./middleware');
const ejs = require('ejs');
const cors = require('cors');
const sendOTP = require('./sendotptomail');
const authRouter = require('./auth');
const app = express();
const bcrypt = require('bcrypt');
const PORT = 4000;
const mongoose = require('mongoose');


app.set('view engine','ejs');

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.json());

app.use(cors({
  origin: 'http://localhost:3000',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
}));

// Initialize express-session
app.use(session({
  secret: 'your-secret-key',
  resave: true,
  saveUninitialized: true,
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// const User = require('./middleware');

// Serialize user to the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).exec();

    if (user) {
      done(null, user);
    } else {
      done(new Error('User not found'), null);
    }
  } catch (error) {
    done(error, null);
  }
});
// Use the authRouter for authentication routes
app.use('/', authRouter);

// JWT Authentication Middleware
app.use('/dashboard', (req, res, next) => {
  console.log("im in dash route")
  const token = req.cookies.token;
  if (!token) {
    console.log("im in token");
    return res.redirect('/login');
  }

  jwt.verify(token, 'secret_key', (err, decoded) => {
    if (err) {
      console.log("im in verify");

      return res.redirect('/login');
    }

    req.user = decoded;
    next();
  });
});

app.get('/home',(req,res)=>{
  res.render('home');

});
// Dashboard route
app.get('/dashboard', async(req, res) => {
  const { username, googleId } = req.user;
  const user = await User.findOne({
    $or: [{ username: username }, { email: username }],
  });
  console.log(user);

  app.locals.user = user;
  const hotels = await Hotel.find();

  res.render('dashboard', { username,hotels });
});

app.get('/hotel/:hotelId', async (req, res) => {
  try {
    const { hotelId } = req.params;

    // Fetch hotel details and related data from the database
    const hotel = await Hotel.findById(hotelId);
    // Assuming you have a Review model for reviews and analytics
    const reviews = await Review.find({ hotel: hotelId });
    const categorys = await Category.find();

    // Render the hotel details page with reviews and analytics
    res.render('hotel-details', { hotel, reviews,categorys });
  } catch (error) {
    console.error('Error fetching hotel details:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Add this route to your Express app
app.get('/hotel/:hotelId/category/:categoryId', async (req, res) => {
  try {
    const { hotelId, categoryId } = req.params;

    // Fetch hotel details, category, and subcategories from the database
    const hotel = await Hotel.findById(hotelId);
    const category = await Category.findById(categoryId);
    const subcategories = await Subcategory.find({ category: categoryId });

    // Render the category details page with subcategories
    res.render('category-details', { hotel, category, subcategories });
  } catch (error) {
    console.error('Error fetching category details:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route to render the form for adding a new hotel
app.get('/add-hotel', (req, res) => {
  res.render('add-hotel'); // Create a corresponding EJS template for the form
});

// Route to handle the form submission
app.post('/add-hotel', async (req, res) => {
  try {
    const { name, location,user } = req.body;
    const newHotel = new Hotel({
      name,
      location,
      owner:user._id,
    });

    // Save the new hotel to the database
    await newHotel.save();

    // Redirect to the user's profile page or any other desired page
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Error adding a new hotel:', error);
    res.status(500).send('Internal Server Error');
  }
});




// Google Sign-In route
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/dashboard',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    const token = jwt.sign({ googleId: req.user.googleId }, 'secret_key', { expiresIn: '1h' });
    res.cookie('token', token);
    res.redirect('/dashboard');
  }
);

app.post('/send-otp', async (req, res) => {
  const { identifier } = req.body;

  try {
    // Check if the identifier exists in the database (either username or email)
    const user = await User.findOne({ $or: [{ username: identifier }, { email: identifier }] });

    if (user) {
      // Assuming you have a function sendOTP that sends the OTP to the provided email
      const otp = await sendOTP(user.email);

      // You can store the OTP in the session or send it in the response, depending on your requirements
      req.session.otp = otp;

      return res.json({
        status: 200,
        otp: otp,
      });
    } else {
      // If the identifier does not exist, return an error response
      return res.status(404).json({ success: false, error: 'User not found' });
    }
  } catch (error) {
    console.error('Error sending OTP:', error.message);
    return res.status(500).json({ success: false, error: 'Error sending OTP' });
  }
});

app.post('/reset-password', async (req, res) => {
  const { identifier, newPassword } = req.body;
  

  try {
    // Check if the user exists in the database
    const user = await User.findOne({ $or: [{ username: identifier }, { email: identifier }] });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the database
    user.password = hashedPassword;
    await user.save();

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});






app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
