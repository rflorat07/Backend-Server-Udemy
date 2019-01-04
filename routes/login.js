// Requires
var express = require('express');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

// Config
var SEED = require('../config/config').SEED;
var CLIENT_ID = require('../config/config').CLIENT_ID;

// Inicializar variables
var app = express();

// Models
var Usuario = require('../models/usuario');

// Google
const {
    OAuth2Client
} = require('google-auth-library');
const client = new OAuth2Client(CLIENT_ID);


// ==========================================
// Autenticación de Google
// ==========================================
async function verify(token) {

    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID,
    });

    const payload = ticket.getPayload();
    //const userid = payload['sub'];

    return {
        nombre: payload.name,
        email: payload.email,
        img: payload.picture,
        google: true
    }
}

app.post('/google', async (req, res) => {

    var token = req.body.token;

    var googleUser = await verify(token)
        .catch(error => {
            return res.status(403).json({
                ok: false,
                mensaje: 'Token no válido',
                errors: error
            });
        });

    Usuario.findOne({
        email: googleUser.email
    }, (error, usuarioDB) => {

        if (error) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar usuario',
                errors: error
            });
        }

        if (usuarioDB) {

            if (usuarioDB.google === false) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Deve de usar su autenticación normal',
                });

            } else {

                var token = jwt.sign({
                    usuario: usuarioDB
                }, SEED, {
                    expiresIn: 14400
                }) //4 horas

                res.status(200).json({
                    ok: true,
                    usuario: usuarioDB,
                    token: token,
                    id: usuarioDB._id
                });
            }
        } else {
            // El usuario no existe ... hay que crearlo

            var usuario = new Usuario();

            usuario.nombre = googleUser.nombre;
            usuario.email = googleUser.email;
            usuario.img = googleUser.img;
            usuario.google = true;
            usuario.password = ':)';

            usuario.save((error, usuarioDB) => {

                var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 }) //4 horas

                res.status(200).json({
                    ok: true,
                    usuario: usuarioDB,
                    token: token,
                    id: usuarioDB._id
                });

            });

        }



    });

    // res.status(200).json({
    //     ok: true,
    //     mensaje: 'OK!!!',
    //     googleUser: googleUser
    // });

});


// ==========================================
// Autenticación normal
// ==========================================

app.post('/', (req, res) => {

    var body = req.body;

    Usuario.findOne({
        email: body.email
    }, (error, usuarioDB) => {

        if (error) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar usuario',
                errors: error
            });
        }

        if (!usuarioDB) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Credenciales incorrectas - email',
                errors: error
            });
        }

        if (!bcrypt.compareSync(body.password, usuarioDB.password)) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Credenciales incorrectas - password',
                errors: error
            });
        }

        // Crear un token!!!
        usuarioDB.password = ':)';

        var token = jwt.sign({
            usuario: usuarioDB
        }, SEED, {
            expiresIn: 14400
        }) //4 horas

        res.status(200).json({
            ok: true,
            usuario: usuarioDB,
            token: token,
            id: usuarioDB._id
        });

    });




});


module.exports = app;