// Requires
var express = require('express');

// Middlewares
var mdAutenticacion = require('../middlewares/autenticacion');

// Inicializar variables
var app = express();

// Models
var Medico = require('../models/medico');


// ==========================================
// Obtener todos los medicos
// ==========================================

app.get('/', (req, res, next) => {

    var desde = req.query.desde || 0;
    desde = Number(desde);

    Medico.find({})
        .skip(desde)
        .limit(5)
        .populate('usuario', 'nombre email')
        .populate('hospital')
        .exec(
            (error, medicos) => {
                if (error) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error cargando medico',
                        errors: error
                    });
                }


                Medico.count({}, (error, conteo) => {

                    res.status(200).json({
                        ok: true,
                        medicos: medicos,
                        total: conteo
                    });

                });
            });
});

// ==========================================
// Actualizar medico
// ==========================================

app.put('/:id', mdAutenticacion.verificaToken, (req, res) => {

    var id = req.params.id;
    var body = req.body;

    Medico.findById(id, (error, medico) => {

        if (error) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar medico',
                errors: error
            });
        }

        if (!medico) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El medico con el id' + id + 'no existe',
                errors: {
                    message: 'No existe un medico con ese ID'
                }
            });
        }

        medico.nombre = body.nombre;
        medico.usuario = req.usuario._id;
        medico.hospital = body.hospital;

        medico.save((error, medicoGuardado) => {
            if (error) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar medico',
                    errors: error
                });
            }

            res.status(200).json({
                ok: true,
                medico: medicoGuardado
            });
        });
    });

});

// ==========================================
// Crear un nuevo medico
// ==========================================

app.post('/', mdAutenticacion.verificaToken, (req, res) => {

    var body = req.body;

    var medico = new Medico({
        nombre: body.nombre,
        usuario: req.usuario._id,
        hospital: body.hospital
    });

    medico.save((error, medicoGuardado) => {
        if (error) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al crear medico',
                errors: error
            });
        }

        res.status(201).json({
            ok: true,
            medico: medicoGuardado,
            medicotoken: req.medico
        });
    });
});

// ==========================================
// Borrar un medico por el id
// ==========================================

app.delete('/:id', mdAutenticacion.verificaToken, (req, res) => {

    var id = req.params.id;

    Medico.findByIdAndRemove(id, (error, medicoBorrado) => {

        if (error) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al borrar medico',
                errors: error
            });
        }

        if (!medicoBorrado) {
            return res.status(400).json({
                ok: false,
                mensaje: 'No existe un medico con ese id',
                errors: {
                    message: 'No existe un medico con ese id'
                }
            });
        }

        res.status(200).json({
            ok: true,
            medico: medicoBorrado
        });

    });

});

module.exports = app;