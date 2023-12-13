const swaggerAutogen = require('swagger-autogen')();

const outputFile = './swagger_output.json';
const endpointsFiles = ['./routes/api/v1/index.js'];

const doc = {
	  info: {
		version: "1.0.0",
		title: "Cocktail Bar",
		description: "Documentation of Coctail Bar API",
	  },
	  host: "api-dot-cit313-pbhenson-cocktail-bar.uc.r.appspot.com",
	  basePath: "/api/v1",
	  schemes: ["https"],
	  consumes: ["application/json"],
	  produces: ["application/json"],
};

swaggerAutogen(outputFile, endpointsFiles, doc);