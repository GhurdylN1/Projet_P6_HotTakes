const multer = require('multer');

const MIME_TYPES = {
    'image/jpg': 'jpg',
    'image/jpeg': 'jpg',
    'image/png': 'png'
};

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'images')
    },
    filename: (req, file, callback) => {
        const name = file.originalname.split(' ').join('_');
        const extension = MIME_TYPES[file.mimetype];
        callback(null, name + Date.now() + '.' + extension);
    }
});

// On veut un filtre qui n'enregistre pas dans la DB si le format de l'image n'est pas valide ou un autre fichier comme un *.exe par exemple
const uploadImg = multer({
    storage: storage,
    fileFilter(req, file, callback) {
        // ne pas accepter les mimetype qui ne sont pas des images.
        if (file.mimetype in MIME_TYPES) {    
            callback(null, true)
        }else{
            return callback(new Error('Format de fichier non autorisé'))
        }
    },
    // on limite la taille du fichier image à 500ko
    limits: {
        fileSize: 500000
    },
})
module.exports = uploadImg.single('image');