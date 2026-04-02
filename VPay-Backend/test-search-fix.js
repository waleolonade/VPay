const User = require('./models/User');

async function testSearch() {
  try {
    const results = await User.find({
      $or: [
        { phone: { $regex: '4262' } },
        { firstName: { $regex: '4262' } },
        { lastName: { $regex: '4262' } },
      ],
      id: { $ne: 'some-id' },
    }, { limit: 10 });
    
    console.log('Search Results:', results.length);
    if (results.length > 0) {
      console.log('First result:', results[0].firstName, results[0].lastName);
    }
    process.exit(0);
  } catch (err) {
    console.error('Search failed:', err);
    process.exit(1);
  }
}

testSearch();
