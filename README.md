# Kodzero Frontend SDK [alfa]

A lightweight OOP library for frontend applications to easily interact with Kodzero backend APIs. This SDK provides a clean, object-oriented approach for working with your backend data models and authentication.

## Installation

```bash
npm install kodzero-front-sdk-alfa
```

## Authentication

The SDK provides built-in authentication features:

```javascript
// Initialize the SDK with your backend URL
const kodzero = new Kodzero({
  host: 'https://api.your-backend.com'
});

// Sign up a new user
const signupResult = await kodzero.auth.signup({
  email: 'user@example.com',
  password: 'secure_password'
});

// Sign in
const signinResult = await kodzero.auth.signin({
  email: 'user@example.com',
  password: 'secure_password'
});

// Verify current authentication status
const verified = await kodzero.auth.verify();

// Refresh the token
const refreshed = await kodzero.auth.refresh();

// Sign out
await kodzero.auth.signout();

// Manually set tokens (useful for persisting sessions)
kodzero.auth.setTokens('access_token', 'refresh_token');

// Clear tokens
kodzero.auth.clearTokens();
```

## Model

Creating and using models is the core functionality of the SDK. Models provide an OOP approach to interacting with your backend data.

### Creating a Model

```javascript
// Define your data model interface
interface User {
  _id?: string;
  name: string;
  email: string;
  createdAt?: Date;
}

// Optional: Create a schema object for validation
const userSchema = {
  _id: { type: String },
  name: { type: String },
  email: { type: String },
  createdAt: { type: Date }
};

// Create a model for the 'users' collection
const User = kodzero.createModel<User>({
  collection: 'users',
  schema: userSchema // Optional but recommended for validation
});
```

### Instance Methods

After creating a model, you can use its instance methods to work with individual records:

```javascript
// Create a new user instance
const newUser = new User({
  name: 'John Doe',
  email: 'john@example.com'
});

// Save the new user to the database (creates a new record)
await newUser.save();
console.log('New user ID:', newUser.data()._id);

// Get the current data
const userData = newUser.data();

// Update user data with the set method
newUser.set('name', 'Jane Doe');
// Or with object syntax for multiple fields
newUser.set({
  name: 'Jane Doe',
  email: 'jane@example.com'
});

// Update the record in the database
await newUser.update();

// Or use save() which handles both create and update
await newUser.save();

// Validate the data against the schema
const validationResult = newUser.validate();
if (!validationResult.ok) {
  console.error('Validation errors:', validationResult.joinErrors());
}

// Delete the user from the database
await newUser.delete();
```

## Advanced Model Usage

### Custom Methods

You can extend your models with custom methods:

```javascript
// Define your model interface
interface Car {
  _id?: string;
  make: string;
  model: string;
  year: number;
}

// Define custom methods interface
interface CarMethods {
  getDescription: () => string;
  isVintage: () => boolean;
}

// Define your schema
const carSchema = {
  _id: { type: String },
  make: { type: String },
  model: { type: String },
  year: { type: Number }
};

// Create the model with the custom methods type
const Car = kodzero.createModel<Car, CarMethods>({
  collection: 'cars',
  schema: carSchema
});

// Register custom methods
Car.registerMethod('getDescription', function() {
  const data = this.data();
  return `${data.make} ${data.model} (${data.year})`;
});

Car.registerMethod('isVintage', function() {
  return this.data().year < 1980;
});

// Usage
const myCar = await Car.get('car_id_here');
console.log(myCar.getDescription());  // "Toyota Corolla (2020)"
console.log(myCar.isVintage());       // false
```

## Static Model Operations

Models provide static methods for working with collections as a whole:

### Fetching Data

```javascript
// Find a document and return plain data (not an instance)
const userData = await User.find('user_id_here');

// Find multiple documents with optional query parameters
const users = await User.findMany({
  page: 1,           // Pagination: page number
  perPage: 10,       // Items per page
  search: 'John',    // Search term
  sort: '-createdAt', // Sort by field (prefix with - for descending)
  fields: ['name', 'email'] // Specific fields to return
});

// Create a single document
const newUser = await User.create({
  name: 'Alice',
  email: 'alice@example.com'
});

// Update a single document by ID
const updatedUser = await User.update('user_id', {
  name: 'Updated Name'
});

// Delete a document by ID
const deleted = await User.delete('user_id');

// Get distinct values
const distinctNames = await User.distinct(['name']);
```

### Batch Operations

The SDK supports batch operations for improved efficiency:

```javascript
// Create multiple records at once
const newUsers = await User.createMany([
  { name: 'John', email: 'john@example.com' },
  { name: 'Jane', email: 'jane@example.com' }
]);

// Update multiple records
const updates = await User.updateMany([
  { _id: 'id1', name: 'Updated Name 1' },
  { _id: 'id2', email: 'updated2@example.com' }
]);

// Delete multiple records
const deleteResults = await User.deleteMany(['id1', 'id2', 'id3']);
```

## Validation

The SDK has built-in validation capabilities based on `validno` package ([Validno docs](https://validno.kodzero.pro/)). When creating a model with a schema, you can validate your data:

```javascript
// Define a schema with validation rules
const carSchema = {
  _id: { type: String },
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number }
};

const Car = kodzero.createModel<Car>({
  collection: 'cars',
  schema: carSchema
});

const car = new Car({
  make: 'Toyota',
  // Missing required 'model' field will be caught
});

const validationResult = car.validate();
if (!validationResult.ok) {
  console.error('Validation failed:', validationResult.joinErrors());
  // Output: "Validation failed: model is required"
}
```

## Working with Nested Data

You can easily work with nested data structures:

```javascript
// Create a model with nested data
interface Profile {
  _id?: string;
  user: {
    name: string;
    contact: {
      email: string;
      phone?: string;
    }
  }
}

const profileSchema = {
  _id: { type: String },
  user: {
    name: { type: String },
    contact: {
        email: { type: String },
        phone: { type: String }
    }
  }
};

const Profile = kodzero.createModel<Profile>({
  collection: 'profiles',
  schema: profileSchema
});

const profile = new Profile({
  user: {
    name: 'John Doe',
    contact: {
      email: 'john@example.com'
    }
  }
});

// Set nested properties
profile.set('user.contact.phone', '123-456-7890');

// Or with object syntax for multiple nested properties
profile.set({
  'user.name': 'Jane Doe',
  'user.contact.email': 'jane@example.com'
});

await profile.save();
```

## Error Handling

The SDK provides proper error handling for API requests:

```javascript
try {
  const user = await User.get('non_existent_id');
} catch (error) {
  if (error.name === 'KodzeroApiError') {
    console.error('API Error:', error.message, error.status);
  } else if (error.name === 'KodzeroValidationError') {
    console.error('Validation Error:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```
