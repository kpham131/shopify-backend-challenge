const Joi = require('joi')
module.exports.itemSchema = Joi.object({
    item: Joi.object({
        name: Joi.string().required(),
        quantity: Joi.number().required().min(0),
    }).required()
})
