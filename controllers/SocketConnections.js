module.exports = (io) => {
  const ss               = require('socket.io-stream');
  const escape           = require('escape-html');
  const formatAMPM       = require('../helpers/formatAMPM');
  const fs               = require('fs');
  const path             = require('path');
  const shortid          = require('shortid');
  const imagemin         = require('imagemin');
  const imageminJpegtran = require('imagemin-jpegtran');
  const imageminPngquant = require('imagemin-pngquant');
  const Group            = require('../models/group');

  io.on('connection', (socket) => {
    socket.emit('details', {
      id: socket.request.user.id,
      name: socket.request.user.name,
      photo: socket.request.user.picture
    });

    // Chat Message
    socket.on('message', msg => {
      if(!!msg.trim()) {
        let message = {
          id: socket.request.user.id,
          name: socket.request.user.name,
          msg: escape(msg.trim()),
          time: formatAMPM(new Date()),
          photo: socket.request.user.picture,
        };
        socket.broadcast.emit('message', message);
      }
    });

    // Image - 5MB Limit
    ss(socket).on('image', (stream, data) => {
      let filepath = './public/uploads/'
      let ext = path.extname(path.basename(data.name));
      if((ext === '.jpeg' || ext === '.jpg' || ext === '.png') && data.size < 5000000) {
        let filename = `${shortid.generate()}${ext}`;
        let save = stream.pipe(fs.createWriteStream(filepath + filename));
        save.on('finish', () => {
          data.filename = filename;
          console.log(data);
          let message = {
            id: socket.request.user.id,
            name: socket.request.user.name,
            msg: '',
            image: `/uploads/${filename}`,
            time: formatAMPM(new Date()),
            photo: socket.request.user.picture,
          }
          socket.broadcast.emit('message', message);
        });
      }
    });
  });

  // io.of('/rooms').on('connection', (socket) => {
  //   socket.on('create room', (groupDetails) => {
  //     if(!!groupDetails.name.trim() && !!groupDetails.picture && !!groupDetails.members) {
  //       let newGroup = new Group({
  //         name: escape(groupDetails.name.trim()),
  //         picture: groupDetails.picture,
  //         members: groupDetails.members.split(','),
  //         messages: []
  //       });
  //
  //       newGroup.save((err, data) => {
  //         if(err) throw err;
  //         socket.emit('created', data.name);
  //       });
  //     }
  //   });
  // });
}
