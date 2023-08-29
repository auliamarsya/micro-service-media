const express = require('express');
const router = express.Router();
const isBase64 = require('is-base64');
const base64Img = require('base64-img');
const fs = require('fs');

const { Media } = require('../models');

/* GET media listing. */
router.get('/', async function (req, res, next) {
  const medias = await Media.findAll({
    attributes: ['id', 'image']
  });

  const mappedMedia = medias.map((media) => {
    media.image = `${req.get('host')}/${media.image}`;
    return media;
  })

  return res.json({
    status: "success",
    data: mappedMedia
  })
});

router.post('/', function (req, res, next) {
  const image = req.body.image;

  if (!isBase64(image, { mimeRequired: true })) {
    return res.status(400).json({
      status: 'error',
      message: 'invalid base64'
    })
  }

  base64Img.img(image, './public/images/', Date.now(), async (err, filepath) => {
    if (err) {
      return res.status(400).json({
        status: 'error',
        message: err.message
      })
    }

    const filename = filepath.split("\\").pop().split("/").pop();

    const media = await Media.create({ image: `images/${filename}` });
    return res.json({
      status: "success",
      data: {
        id: media.id,
        image: `${req.get('host')}/images/${filename}`
      }
    })
  })
});

router.delete('/:id', async function (req, res) {
  const id = req.params.id;

  const media = await Media.findByPk(id);

  if (!media) {
    return res.status(404).json({
      status: 'error',
      message: 'media not found'
    })
  }

  fs.unlink(`./public/${media.image}`, async (error) => {
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.message
      })
    }

    await media.destroy();

    return res.json({
      status: "success",
      message: "Successfully delete image"
    })

  })
})

module.exports = router;
