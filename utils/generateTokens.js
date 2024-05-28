const jwt = require('jsonwebtoken');

const generateTokens = (existUser,userType) => {
    try {
        let ACCESS_TOKEN_SECRETKEY = process.env.ACCESS_TOKEN_SECRETKEY;
        let REFRESH_TOKEN_SECRETKEY = process.env.REFRESH_TOKEN_SECRETKEY;

        if (!ACCESS_TOKEN_SECRETKEY || !REFRESH_TOKEN_SECRETKEY) {
            throw new Error('Secret key not provided.');
        }
        
        const access_token = jwt.sign({ userId: existUser._id,userType:userType }, ACCESS_TOKEN_SECRETKEY, { expiresIn: '3m' });
        const refresh_token = jwt.sign({ userId: existUser._id,userType:userType }, REFRESH_TOKEN_SECRETKEY, { expiresIn: '8d' });
       
        return { access_token, refresh_token };
    } catch (error) {
        throw new Error('Error generating tokens.');
    }
};

module.exports = generateTokens;
