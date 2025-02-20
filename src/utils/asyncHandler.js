// as we will talk to the DB again and again in different situations , we will have this wrapper/function whenever we want to execute a function inside or talk to the database 

// this is one method which is also used in industries but we will be not using this in this project 

const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch(err => next(err.message))

    }
}

export { asyncHandler }

////////////////////////
// need to recheck this file
/////////////////////////


// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             message: error.message,
//             success: false
//         })
//     }

// } 