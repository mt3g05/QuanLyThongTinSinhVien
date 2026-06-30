async function runTest() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'b21dccn001',
        password: 'password123'
      })
    });
    const loginData = await loginRes.json();
    console.log('Login Response:', loginData);
    
    if (loginData.success) {
      const token = loginData.data?.token || loginData.data?.accessToken;
      const headers = { Authorization: `Bearer ${token}` };

      // 2. Fetch available courses
      const availRes = await fetch('http://localhost:5000/api/student/courses/available', { headers });
      const availData = await availRes.json();
      const availableCourses = availData.data;
      console.log(`Found ${availableCourses.length} available courses`);

      if (availableCourses.length === 0) {
        console.log('No courses available, stopping test.');
        return;
      }

      const courseToRegister = availableCourses[0];
      console.log(`Trying to register for course: ${courseToRegister.course_code} (ID: ${courseToRegister.id})`);

      // 3. Register course
      const regRes = await fetch(`http://localhost:5000/api/student/courses/register/${courseToRegister.id}`, { method: 'POST', headers });
      const regData = await regRes.json();
      console.log('Register response:', regData);

      // 4. Get registered courses
      const myRegRes = await fetch('http://localhost:5000/api/student/courses/my-registrations', { headers });
      const myRegData = await myRegRes.json();
      console.log(`Registered for ${myRegData.data.length} courses`);

      // 5. Cancel registration
      if (myRegData.data.length > 0) {
        const courseToCancel = myRegData.data[0];
        console.log(`Trying to cancel course: ${courseToCancel.course_code} (course_id: ${courseToCancel.course_id})`);
        
        const cancelRes = await fetch(`http://localhost:5000/api/student/courses/cancel/${courseToCancel.course_id}`, { method: 'POST', headers });
        const cancelData = await cancelRes.json();
        console.log('Cancel response:', cancelData);
      }
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTest();
