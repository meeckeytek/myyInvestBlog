const msg = {
  alreadyExist: {
    status: "Faild",
    code: 409,
    Message: "Already exist",
  },
  defaultMsg: {
    status: "Success",
    code: 200,
    Message: "MyyInvest tech team interns API",
  },
  inputError: {
    status: "Faild",
    code: 422,
    Message: "Please check all inputs for validity",
  },

  newInputSuccess: {
    status: "Success",
    code: 201,
    Message: "End point returned successfully",
  },
  notFound: {
    status: "Faild",
    code: 404,
    Message: "End point returned not found",
  },
  notSuccessful: {
    status: "Error",
    code: 400,
    Message: "End point returned not successful",
  },
  serverError: {
    status: "Faild",
    code: 500,
    Message: "Something went wrong, Please try again later",
  },

  success: {
    status: "Success",
    code: 200,
    Message: "End point returned successfully",
  },

  notAuthorized:{
    status: "Failed",
    code: 403,
    Message: "You are not authorized to perform this function"
  },
  notAdmin:{
    status: "Failed",
    code: 403,
    Message: "Only Admins are authorized to perform this operation"
  }
};
export default msg;
