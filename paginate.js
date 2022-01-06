// paging from backend
module.exports = function paginate(model) {
    return async (req, res, next) => {
        let page =0
        if(!req.query.page){
            page = 1;
        }
        else{
            page = parseInt(req.query.page)
        }
        const limit = 10
    
        const start = (page - 1) * limit
        const end= page * limit
    
        const result = {}
  
        if (end < await model.countDocuments().exec()) {
            result.next = {
            page: page + 1,
            }
        }
        
        if (start > 0) {
            result.previous = {
            page: page - 1,
            }
        }
        try {
            result.model = await model.find({status: 'active'}).limit(limit).skip(start).exec()
            res.paginatedResult = result
            next()
        } catch (e) {
            res.status(500).json({ message: e.message })
        }
    }
}