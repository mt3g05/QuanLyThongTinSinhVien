const axios = require('axios');

async function runTest() {
  try {
    // 1. Login as student
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'b24dccn009',
      password: 'password123'
    });
    const token = loginRes.data.data.token || loginRes.data.data.accessToken;
    const headers = { Authorization: `Bearer ${token}` };

    console.log('Logged in as student b24dccn009');

    // 2. Fetch available courses
    const availRes = await axios.get('http://localhost:5000/api/student/courses/available', { headers });
    const availableCourses = availRes.data.data;
    console.log(`Found ${availableCourses.length} available courses`);

    if (availableCourses.length === 0) {
      console.log('No courses available, stopping test.');
      return;
    }

    const courseToRegister = availableCourses[0];
    console.log(`Trying to register for course: ${courseToRegister.course_code} (ID: ${courseToRegister.id})`);

    // 3. Register course
    try {
      const regRes = await axios.post(`http://localhost:5000/api/student/courses/register/${courseToRegister.id}`, {}, { headers });
      console.log('Register response:', regRes.data);
    } catch (err) {
      console.log('Register error:', err.response?.data || err.message);
    }

    // 4. Get registered courses
    const myRegRes = await axios.get('http://localhost:5000/api/student/courses/my-registrations', { headers });
    console.log(`Registered for ${myRegRes.data.data.length} courses`);

    // 5. Cancel registration
    if (myRegRes.data.data.length > 0) {
      const courseToCancel = myRegRes.data.data[0];
      console.log(`Trying to cancel course: ${courseToCancel.course_code} (course_id: ${courseToCancel.course_id})`);
      
      try {
        const cancelRes = await axios.post(`http://localhost:5000/api/student/courses/cancel/${courseToCancel.course_id}`, {}, { headers });
        console.log('Cancel response:', cancelRes.data);
      } catch (err) {
        console.log('Cancel error:', err.response?.data || err.message);
      }
    }

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

runTest();
