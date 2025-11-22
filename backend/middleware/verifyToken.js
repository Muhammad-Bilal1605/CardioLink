import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
	// Try to get token from cookie first, then from Authorization header
	const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
	
	if (!token) {
		return res.status(401).json({ 
			success: false, 
			message: "Unauthorized - no token provided" 
		});
	}
	
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		if (!decoded) {
			return res.status(401).json({ 
				success: false, 
				message: "Unauthorized - invalid token" 
			});
		}

		// Support different token payload formats
		req.userId = decoded.userId || decoded.id || decoded.patientId || decoded.employerId;
		
		if (!req.userId) {
			return res.status(401).json({ 
				success: false, 
				message: "Unauthorized - token missing user identifier" 
			});
		}

		next();
	} catch (error) {
		console.log("Error in verifyToken ", error);
		return res.status(401).json({ 
			success: false, 
			message: "Unauthorized - token verification failed",
			error: error.message 
		});
	}
};
