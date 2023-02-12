const errorHandler = (err, req, res, next ) => {

    const statusCode = res.statusCode ?? 500

    console.log(statusCode);
    console.log(err);

    return res.status(statusCode)
        .json({
            message: err.message,
        })
};

module.exports= errorHandler;