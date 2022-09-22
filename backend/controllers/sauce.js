const Sauce = require('../models/Sauces');
const fs = require('fs');
const sanitize = require('mongo-sanitize'); // se proteger des injections diverses

// création des sauces

exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(sanitize(req.body.sauce)); // exemple d'utilisation de sanitize
  delete sauceObject._id;
  delete sauceObject._userId;
  const sauce = new Sauce ({
    ...sauceObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });

  sauce.save()
    .then(() => { res.status(201).json({message: 'Sauce enregistrée'})})
    .catch(error => { res.status(400).json( { error })})
  };

// modification des sauces

  exports.modifySauce = (req, res, next) => {
    const sauceObject = req.file ? {
      ...JSON.parse(sanitize(req.body.sauce)),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };

    delete sauceObject._userId;
    Sauce.findOne({_id: req.params.id})
    .then((sauce) => {
      if (sauce.userId != req.auth.userId) {
        res.status(401).json({ message : 'Not authorized' });
      } else {
        Sauce.updateOne({ _id: req.params.id}, { ...sauceObject, _id: req.params.id})
        .then(() => res.status(200).json({message : 'Sauce modifiée!'}))
        .catch(error => res.status(401).json({ error }));
      }
    })
    .catch((error) => {
      res.status(400).json({ error });
    })
  };

// suppression des sauces

  exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id})
        .then(sauce => {
            if (sauce.userId != req.auth.userId) {
                res.status(401).json({message: 'Not authorized'});
            } else {
                const filename = sauce.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Sauce.deleteOne({_id: req.params.id})
                        .then(() => { res.status(200).json({message: 'Sauce supprimée !'})})
                        .catch(error => res.status(401).json({ error }));
                });
            }
        })
        .catch( error => {
            res.status(500).json({ error });
        });
 };

// affichage des sauces

  exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({ _id : req.params.id })
    .then(sauce => res.status(200).json(sauce))
    .catch(error => res.status(404).json({ error }));
  };

  exports.getAllSauces = (req, res, next) => {
    Sauce.find()
    .then(sauces => res.status(200).json(sauces))
    .catch(error => res.status(400).json({ error }));
    };


// Fonctionalité Likes et Dislikes de sauces

exports.voteSauce = (req, res, next) => {
  Sauce.findOne({_id: req.params.id})
  .then((sauce) => {
    // constantes like et dislike
    const voteLike = sauce.usersLiked.includes(req.body.userId)
    const voteDislike = sauce.usersDisliked.includes(req.body.userId)

    // Un utilisateur veut liker une sauce
    if (req.body.like === 1 && !voteLike) {
      //on ajoute un like et l'id de l'utilisateur dans la liste des Likers , on va utiliser $inc et $push pour cela. 
      Sauce.updateOne({_id: req.params.id}, {
        $inc: { likes: 1 },
        $push: { usersLiked: req.body.userId }
      })
      .then(() => res.status(200).json({ message: "user's Like added"}))
      .catch((error) => res.status(401).json({ error }));
    }

    // Un utilisateur veut disliker une sauce
    else if (req.body.like === -1 && !voteDislike) {
      //on ajoute un dislike et l'id de l'utilisateur dans la liste des Dislikers , on va utiliser $inc et $push pour cela.
      Sauce.updateOne({ _id: req.params.id}, {
        $inc: { dislikes: 1 },
        $push: { usersDisliked: req.body.userId }
      })
      .then(() => res.status(200).json({ message: "user's Dislike added"}))
      .catch((error) => res.status(401).json({ error }));
    }

    // Si l'utilisateur veut retirer son like ou dislike
    else if (req.body.like === 0) {
      if (voteLike) {
          Sauce.updateOne({ _id: req.params.id }, {
              $inc: { likes: -1 },
              $pull: { usersLiked: req.body.userId, }
          }).then(() => { res.status(200).json({ message: "user's Like removed" }) })
              .catch(error => res.status(401).json({ error }));
      }
      else if (voteDislike) {
          Sauce.updateOne({ _id: req.params.id }, {
              $inc: { dislikes: -1 },
              $pull: { usersDisliked: req.body.userId, }
          }).then(() => { res.status(200).json({ message: "user's Dislike removed'" }) })
              .catch(error => res.status(401).json({ error }));
      }
  }
})
.catch((error) => {
  res.status(400).json({ error });
  });
}