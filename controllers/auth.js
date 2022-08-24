const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer')

const User = require('../models/user');

const transporter = nodemailer.createTransport({
  host: "smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "dc9ca81cde9ba6",
    pass: "c7814ed5725169"
  }
});

exports.getLogin = (request, response, next) => {

  let message = request.flash('error');

  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  response.render('auth/login', {
    path: '/login',
    title: 'Login',
    errorMessage: message
  });

};

exports.postLogin = (request, response, next) => {

  const body = request.body;

  User.findOne({ email: body.email })
    .then((user) => {

      if (user === null) {
        request.flash('error', 'Account with this email does not exists.');
        return response.redirect('/login');
      }

      bcrypt.compare(body.password, user.password)
        .then((matched) => {

          if (matched === false) {
            request.flash('error', 'Password mismatch.');
            return response.redirect('/login');
          }

          request.session.authenticated = true;
          request.session.user = user;
          request.session.save((error) => {
            console.log(error);
            return response.redirect('/');
          });

        })
    })
    .catch((error) => console.log(error));

};

exports.postLogout = (request, response, next) => {

  request.session.destroy(() => {
    response.redirect('/');
  });

};

exports.getSignup = (request, response, next) => {

  let message = request.flash('error');

  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  response.render('auth/signup', {
    path: '/signup',
    title: 'Signup',
    errorMessage: message
  });

};

exports.postSignup = (request, response, next) => {

  const body = request.body;

  const email = body.email;

  User.findOne({ email })
    .then((userRecord) => {

      if (userRecord !== null) {
        request.flash('error', 'Account with this email already exists. Try with another email!');
        return response.redirect('/signup');
      }

      return bcrypt.hash(body.password, 12)
        .then((hashedPassword) => {

          const data = {
            name: body.name,
            email,
            password: hashedPassword,
            cart: { items: [] }
          };

          const user = new User(data);

          return user.save();

        });

    })
    .then(() => {

      response.redirect('/login');

      const mailOptions = {
        from: 'bookshop@admin.com',
        to: email,
        subject: 'Registered successfully!',
        html: `<h2 style="color:#ff6600;">Hello ${body.name}!, Welcome to Book shop!</h2>`
      };

      transporter.sendMail(mailOptions, function (error, info) {

        if (error) {
          return console.log(error);
        }

      })

    })
    .catch((error) => console.log(error));


};