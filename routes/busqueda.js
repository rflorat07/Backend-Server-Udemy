// Requires
var express = require('express');

// Inicializar variables
var app = express();

// Models
var Medico = require('../models/medico');
var Usuario = require('../models/usuario');
var Hospital = require('../models/hospital');

// ==========================================
// Busqueda por collección
// ==========================================
app.get('/coleccion/:tabla/:busqueda', (req, res, next) => {

    var promesa;

    var tabla = req.params.tabla;
    var busqueda = req.params.busqueda;
    var regex = new RegExp(busqueda, 'i');

    switch (tabla) {
        case 'medicos':
            promesa = buscarMedicos(busqueda, regex)
            break;

        case 'usuarios':
            promesa = buscarUsuarios(busqueda, regex)
            break;

        case 'hospitales':
            promesa = buscarHospitales(busqueda, regex)
            break;

        default:
            return res.status(400).json({
                ok: false,
                mensaje: 'Los tipos de busqueda sólo son: usuarios, medicos y hospitales',
                error: {
                    message: 'Tipo de coleccion/tabla no válido'
                }
            });
    }

    return promesa.then((respuesta) => {
        res.status(200).json({
            ok: true,
            [tabla]: respuesta,
        });
    });

});



// ==========================================
// Busqueda general
// ==========================================

app.get('/todo/:busqueda', (req, res, next) => {

    var busqueda = req.params.busqueda;
    var regex = new RegExp(busqueda, 'i');

    Promise.all([buscarHospitales(busqueda, regex), buscarMedicos(busqueda, regex), buscarUsuarios(busqueda, regex)]).then((respuestas) => {

        res.status(200).json({
            ok: true,
            hospitales: respuestas[0],
            medicos: respuestas[1],
            usuarios: respuestas[2]
        });
    });
});

function buscarHospitales(busqueda, regex) {
    return new Promise((resolve, reject) => {
        Hospital.find({
                nombre: regex
            })
            .populate('usuario', 'nombre email')
            .exec((error, hospitales) => {

                if (error) {
                    reject('Error al cargar hospitales', error);
                } else {
                    resolve(hospitales)
                }

            });
    });
}

function buscarMedicos(busqueda, regex) {
    return new Promise((resolve, reject) => {
        Medico.find({
                nombre: regex
            })
            .populate('usuario', 'nombre email')
            .populate('hospital')
            .exec((error, medicos) => {

                if (error) {
                    reject('Error al cargar medicos', error);
                } else {
                    resolve(medicos)
                }

            });
    });
}

function buscarUsuarios(busqueda, regex) {
    return new Promise((resolve, reject) => {
        Usuario.find({}, 'nombre email role ')
            .or([{
                nombre: regex
            }, {
                email: regex
            }])
            .exec((error, usuarios) => {

                if (error) {
                    reject('Error al cargar usuarios', error);
                } else {
                    resolve(usuarios)
                }

            });
    });
}

module.exports = app;