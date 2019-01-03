// Requires
var express = require('express');
var bcrypt = require('bcryptjs');

var mdAutenticacion = require('../middlewares/autenticacion');

// Inicializar variables
var app = express();

// Models
var Usuario = require('../models/usuario')

// ==========================================
// Obtener todos los usuarios
// ==========================================

app.get('/', (req, res, next) => {


    Usuario.find({}, 'nombre email img role')
        .exec(
            (error, usuarios) => {
                if (error) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error cargando usuario',
                        errors: error
                    });
                }

                res.status(200).json({
                    ok: true,
                    usuarios: usuarios
                });

            });
});

// ==========================================
// Actualizar usuario
// ==========================================

app.put('/:id', mdAutenticacion.verificaToken, (req, res) => {

    var id = req.params.id;
    var body = req.body;

    Usuario.findById(id, (error, usuario) => {

        if (error) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar usuario',
                errors: error
            });
        }

        if (!usuario) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El usuario con el id' + id + 'no existe',
                errors: {
                    message: 'No existe un usuario con ese ID'
                }
            });
        }

        usuario.nombre = body.nombre;
        usuario.email = body.email;
        usuario.role = body.role;

        usuario.save((error, ) => {
            usuario.save((error, usuarioGuardado) => {
                if (error) {
                    return res.status(400).json({
                        ok: false,
                        mensaje: 'Error al actualizar usuario',
                        errors: error
                    });
                }

                usuarioGuardado.password = ':)';

                res.status(200).json({
                    ok: true,
                    usuario: usuarioGuardado
                });
            });

        });

    });

});

// ==========================================
// Crear un nuevo usuario
// ==========================================

app.post('/', mdAutenticacion.verificaToken, (req, res) => {

    var body = req.body;

    var usuario = new Usuario({
        nombre: body.nombre,
        email: body.email,
        password: bcrypt.hashSync(body.password, 10),
        img: body.img,
        role: body.role
    });

    usuario.save((error, usuarioGuardado) => {
        if (error) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al crear usuario',
                errors: error
            });
        }

        res.status(201).json({
            ok: true,
            usuario: usuarioGuardado,
            usuariotoken: req.usuario
        });
    });
});

// ==========================================
// Borrar un usuario por el id
// ==========================================

app.delete('/:id', mdAutenticacion.verificaToken, (req, res) => {

    var id = req.param.id;

    Usuario.findByIdAndRemove(id, (error, usuarioBorrado) => {

        if (error) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al borrar usuario',
                errors: error
            });
        }

        if (!usuarioBorrado) {
            return res.status(400).json({
                ok: false,
                mensaje: 'No existe un usuario con ese id',
                errors: {
                    message: 'No existe un usuario con ese id'
                }
            });
        }

        res.status(200).json({
            ok: true,
            usuario: usuarioBorrado
        });

    });

});

module.exports = app;