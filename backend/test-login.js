require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

const testLogin = async () => {
  try {
    console.log('Testing login...\n');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@company.com',
      password: 'admin123'
    });
    
    console.log('✅ Login successful!');
    console.log('\nResponse:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Login failed!');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Message:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
};

testLogin();
