export function storeJwt(jwt){
  window.localStorage.setItem('calorieJwt', jwt)
}

export function getJwt(){
  return window.localStorage.getItem('calorieJwt');
}
