const chai = require('chai');
const chaiHttp = require('chai-http');

chai.use(chaiHttp);
const expect = chai.expect;

const TIMEOUT_MS = 10000;
const host =  'http://localhost:5000';

describe('User API', () => {
  let userId;
  let reminderId;
  // Test POST /v1/users
  describe('POST /v1/users', () => {
    it('should create a new user', async () => {
      const res = await chai.request(host)
        .post('/v1/users')
        .send({
          firstName: 'first',
          lastName: 'last',
          email: 'asdf@mailer.com',
          dob: '1920-02-22',
          location: {
            country: "Indonesia",
            city: "Jakarta",
            timezone: "Asia/Jakarta"
          },
        });
      expect(res).to.have.status(200);
      expect(res.body).to.have.property('data');
      expect(res.body.data).to.have.property('id');
      userId = res.body.data.id;
    }).timeout(TIMEOUT_MS)
  });

  // // Test PUT /v1/users/:id
  describe('PUT /v1/users/:id', () => {
    it('should update the user', async () => {
      const res = await chai.request(host)
        .put(`/v1/users/${userId}`)
        .send({
          firstName: 'newfirst',
          lastName: 'newlast',
          email: 'asdf@mailer.com',
          dob: '1920-02-22',
          location: {
            country: "Indonesia",
            city: "Jakarta",
            timezone: "Asia/Jakarta"
          },
        });
      expect(res).to.have.status(200);
      expect(res.body.data).to.have.property('firstName').equal('newfirst');
      expect(res.body.data).to.have.property('lastName').equal('newlast');
    });
  });

  // // Test GET /v1/users/:id/reminders
  describe('GET /v1/users/:id/reminders', () => {
    it('should get reminders for the user', async () => {
      const res = await chai.request(host)
        .get(`/v1/users/${userId}/reminders`);
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('data');
        expect(res.body.data).to.have.property('results');
        expect(res.body.data.results).to.have.length.above(0);
      // Add assertions for the response body as needed
    });
  });


  // // Test POST /v1/users/:id/reminders
  describe('POST /v1/users/:id/reminders', () => {
    it('should create a reminder for the user', async () => {
      const res = await chai.request(host)
        .post(`/v1/users/${userId}/reminders`)
        .send({
          schedule: '2024-03-01T13:00:00',
          title: 'Deadline',
          message: 'Deadline is passed',
          repeat: 'NONE',
        });
      expect(res).to.have.status(200);
      expect(res.body).to.have.property('data');
      expect(res.body.data).to.have.property('id');
      reminderId = res.body.data.id;
    });
  });

  // // Test DELETE /v1/reminders/:id
  describe('DELETE /v1/reminders/:id', () => {
    it('should delete the reminder', async () => {
      const res = await chai.request(host)
        .delete(`/v1/reminders/${reminderId}`);
      expect(res).to.have.status(200);
    });
  });


  // Test DELETE /v1/users/:id
  describe('DELETE /v1/users/:id', () => {
    it('should delete the user', async () => {
      const res = await chai.request(host)
        .delete(`/v1/users/${userId}`);
      expect(res).to.have.status(200);
    }).timeout(TIMEOUT_MS)
  });
});
