
interface UserLoginInfo {
    email : string ,
    password : string
}
interface User extends UserLoginInfo {
    name : string
}


interface userSignupInfo {
    email : string,
    name : string,
    password : string ,
    phoneNumber : number
}

export { User , userSignupInfo } ;




