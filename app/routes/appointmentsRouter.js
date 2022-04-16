const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const Appointment = require('../models/appointmentModel');

const appointmentsRouter = express.Router();
const requireToken = passport.authenticate('bearer');

appointmentsRouter.get('/get-all-appointments', requireToken, async (req, res) => {
  try {
    const allAppointments = await Appointment.find({patient: req.user.id}).exec();

    res.status(200).json({
      status: 'success',
      message: `You have ${allAppointments.length} appointments`,
      data: allAppointments
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: 'Something goes wrong.',
      error: error.stack
    });
  }
});

appointmentsRouter.post('/create-appointment', requireToken, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({date: req.body.date}).exec();

    if (appointment) {
      return res.status(409).json({
        status: 'fail',
        message: 'Appointment is not available on this date'
      });
    }

    const newAppointment = await Appointment.create({
      patient: req.user._id,
      text: req.body.text,
      date: new Date(req.body.date)
    });

    res.status(201).json({
      status: 'success',
      message: 'You have successfully made an appointment.',
      appointment: newAppointment
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: 'Something goes wrong.',
      error: error.stack
    })
  }
});

appointmentsRouter.patch('/update-appointment/:id', requireToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Incorrect id format.'
      });
    }

    const appointment = await Appointment.findById(req.params.id).exec();

    if (!appointment) {
      return res.status(404).json({
        status: 'fail',
        message: 'Appointment with given id does not exist.'
      });
    }

    if (appointment.patient != req.user.id) {
      return res.status(403).json({
        status: 'fail',
        message: 'You can not update appointments that you do not own.'
      })
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(req.params.id, {
      text: req.body.text,
      date: new Date(req.body.date)
    }, {
      new: true,
      runValidators: true
    }).exec();

    res.status(200).json({
      status: 'success',
      message: 'You have successfully updated your appointment.',
      appointment: updatedAppointment
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: 'Something goes wrong.',
      error: error.stack
    })
  }
});

appointmentsRouter.delete('/delete-appointment/:id', requireToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Incorrect id format.'
      });
    }

    const appointment = await Appointment.findById(req.params.id).exec();

    if (!appointment) {
      return res.status(404).json({
        status: 'fail',
        message: 'Appointment with given id does not exist.'
      })
    }

    if (appointment.patient != req.user.id) {
      return res.status(403).json({
        status: 'fail',
        message: 'You can not delete appointments that you do not own.'
      })
    }

    await Appointment.deleteOne({_id: req.params.id, patient: req.user.id}).exec();

    res.status(200).json({
      status: 'success',
      message: 'Appointment was successfully deleted.'
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: 'Something goes wrong.',
      error: error.stack
    })
  }
});

module.exports = appointmentsRouter;