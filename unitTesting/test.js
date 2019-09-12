const {Builder, By, Key, until} = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
var component, rightPassword, wrongPassword, driver, role

(async () => {
  driver = await new Builder().forBrowser('firefox').build();
  //Make some space
  console.log('\n\n\n')
  rightPassword = 'Testing'
  wrongPassword = 'testing'
  try {
    await driver.get('http://localhost:3000');

    await loginScreens()

    //Login to begin regular user testing.
    credentials = ['unitTesting@regular.com', rightPassword]
    role = 'regular'
    await login(...credentials)
    await regularUserActions();
    await logout()
    console.log('Regular user action testing complete.')

    //Login to begin manager testing.
    credentials = ['unitTesting@manager.com', rightPassword]
    role = 'manager'
    await login(...credentials)
    await regularUserActions();
    await managerActions();
    await logout()
    console.log('Manager action testing complete.')

    //Login to begin admin testing.
    credentials = ['unitTesting@admin.com', rightPassword]
    role = 'admin'
    await login(...credentials)
    await regularUserActions(); //As yourself
    await managerActions();
    await adminActions()
    await logout()
    console.log('Admin action testing complete.')

  } catch(e) {
    console.log(e.message)
  }finally {
    await driver.quit();
  }
})()

function loginScreens(){
  return new Promise(async resolve => {
    //back and both between new user and login.
    component = 'Login Toggle'
    let loginToggle = await driver.findElement(By.id('loginToggle'))

    verifyText(await loginToggle.getAttribute('value'), 'Create New User')

    await loginToggle.click()
    verifyText(await loginToggle.getAttribute('value'), 'Back to login')
    await loginToggle.click();
    verifyText(await loginToggle.getAttribute('value'), 'Create New User')

    //Creating accounts at login.
    var credentials = ['Unit Testing Regular', 'unitTesting@regular.com']
    await createAccount(...credentials)
    await logout()
    await createAccount(...credentials)
    await waitFor('errorMessage', 'className')
    verifyText(
      await getErrorText(),
      'unitTesting@regular.com is already associated with an account.'
    )

    //Logging into new account again.
    credentials = ['unitTesting@regular.com', rightPassword]
    await login(...credentials)
    await logout()
    //old error cleared now.

    //Test password error
    credentials[1] = wrongPassword
    await login(...credentials)
    verifyText(
      await getErrorText(),
      'Password was incorrect.'
    )

    console.log('Login and new account testing complete.')
    resolve()
  })
}

function regularUserActions(){
  return new Promise(async resolve => {
    //Change par calories
    component = 'Meal Entry'
    await changeParCal('2001')

    //test entry errors. All validation erros trigger the same code, so we only need to do one.
    await driver.findElement(By.id('confirmConsumption')).click()
    verifyText(await getErrorText(), `"description" is not allowed to be empty`)

    await addMeal('2000')

    await waitFor('underAte', 'className');
    verifyText(await getSuccessText(), `Added "Testing Description" to your meals!`)

    //modify the calories of the meal and verify that we overate.
    await (await driver.findElements(By.className('calorieTableDisplay')))[0].click()
    let editCalories = await driver.findElement(By.id('enterCaloriesEdit'))
    await editCalories.clear();
    await editCalories.sendKeys('2002');
    await driver.findElement(By.id('confirmConsumptionEdit')).click()
    await waitFor('overAte', 'className');

    //Change parCalories again and make it go back to green.
    await changeParCal('2002')
    await waitFor('underAte', 'className');

    await changeDateField('fromYear', '9999')
    await waitFor('noMealsMessage')
    await changeDateField('fromYear', new Date().getFullYear())
    await waitFor('underAte', 'className');

    //Test the search interface
    await searchArrowsTest(1)

    //Delete the meal
    await deleteMeal()

    await waitFor('noMealsMessage')
    resolve()
  })
}

function managerActions(){
  return new Promise(async resolve => {
    //Add new regular user
    await addNewUser('Regular')
    await editUserName('Testing Change')
    await promoteUser('Manager');
    await promoteUser('Regular');
    await deleteUser()

    //Add new Manager
    await addNewUser('Manager')
    await editUserName('Testing Change')
    await promoteUser('Regular');
    await promoteUser('Manager');
    await deleteUser()
    await searchArrowsTest(0)
    resolve()
  })
}

function adminActions(){
  return new Promise(async resolve => {
    await adminTestRegularActions('Regular')
    await adminTestRegularActions('Manager')
    await adminTestRegularActions('Admin')
    await driver.sleep(1000) //Because it's late and I'm not movitated to do it right.
    await deleteUser()//Delete unitTesting@regular.com for next test.
    resolve()
  })
}

function adminTestRegularActions(role){
  return new Promise(async resolve => {
    var allRoles = ['Regular', 'Manager', 'Admin']

    await addNewUser(role)
    await editUserName('Testing Change')
    await promoteUser(allRoles[(allRoles.indexOf(role) + 1) % 3]);
    await promoteUser(allRoles[(allRoles.indexOf(role) + 2) % 3]);
    await promoteUser(role);

    await (await driver.findElements(By.className('userName')))[0].click()
    await waitFor('unselectedUserButton', 'className')
    await (await driver.findElements(By.className('unselectedUserButton')))[0].click();
    await regularUserActions();
    await deleteUser()
    resolve()
  })
}

function createAccount(userName, email, password){
  return new Promise(async resolve => {
    //Click the toggle if it's set on login.
    await waitFor('loginToggle');
    let loginToggle = await driver.findElement(By.id('loginToggle'))
    if((await loginToggle.getAttribute('value')) === 'Create New User'){
      await loginToggle.click()
    }

    //Create account
    await driver.findElement(By.id('userName')).sendKeys(userName);
    await driver.findElement(By.id('email')).sendKeys(email);
    await driver.findElement(By.id('password')).sendKeys(rightPassword);
    await driver.findElement(By.id('confirmPassword')).sendKeys(rightPassword);
    await driver.findElement(By.id('login')).click();
    resolve();
  })
}

function login(email, password){
  return new Promise(async resolve => {
    //Click the toggle if it's set on Create New User.
    await waitFor('loginToggle');
    let loginToggle = await driver.findElement(By.id('loginToggle'))
    if((await loginToggle.getAttribute('value')) === 'Back to login'){
      await loginToggle.click()
    }

    let emailInput = await driver.findElement(By.id('email'));
    emailInput.clear()
    emailInput.sendKeys(email);

    let passwordInput = await driver.findElement(By.id('password'))
    passwordInput.clear();
    passwordInput.sendKeys(password);

    await driver.findElement(By.id('login')).click();
    resolve();
  })
}

function logout(){
  return new Promise(async resolve => {
    await waitFor('logout')
    let logout = await driver.findElement(By.id('logout'))
    await isClickable(logout, 'logout')
    await logout.click()
    resolve();
  })
}

function changeParCal(newAmount){
  return new Promise(async resolve => {
    component = 'Par Carlorie Changer'
    await waitFor('parChanger')
    await driver.findElement(By.id('parChanger')).click()

    await waitFor('parChangerInput')
    await driver.findElement(By.id('parChangerInput')).sendKeys(newAmount)
    await waitFor('parChangerConfirm')
    await driver.findElement(By.id('parChangerConfirm')).click()

    await waitFor('parChangerDisplay')
    let parChangerDisplay = await driver.findElement(By.id('parChangerDisplay'))
    await driver.wait(
      until.elementTextIs(parChangerDisplay, newAmount),
      5000,
      'parChangerDisplay did not update.'
    )
    verifyText(
      await driver.findElement(By.id('parChangerDisplay')).getText(),
      newAmount
    )
    resolve()
  })
}

function editUserName(newText){
  return new Promise(async resolve => {
    let userNameCell = await (await driver.findElements(By.className('userName')))[0]
    userNameCell.click();
    await waitFor('userName')
    let userName = await driver.findElement(By.id('userName'))
    userName.clear();
    userName.sendKeys(newText);
    await driver.findElement(By.id('login')).click()
    await driver.wait(until.elementTextIs(userNameCell, newText),
      2000, `userNameCell did not update to "${newText}"`
    )
    resolve();
  })
}

function promoteUser(role){
  return new Promise(async resolve => {
    let newUserRoleCell = await (await driver.findElements(By.className('newUserRole')))[0]
    newUserRoleCell.click();
    await waitFor('userName')
    await driver.findElement(By.id('newUserRole')).click();
    await driver.findElement(By.id(`new${role}Select`)).click();
    await driver.findElement(By.id('login')).click()
    await driver.wait(until.elementTextIs(newUserRoleCell, role.toLowerCase()),
      5000, `newUserRoleCell did not update to "${role.toLowerCase()}"`
    )
    resolve();
  })
}

function deleteUser(){
  return new Promise(async resolve => {
    await (await driver.findElements(By.className('userName')))[0].click();
    let deleteUserButton = await (await driver.findElements(By.className('deleteUser')))[0];
    await deleteUserButton.click();
    await deleteUserButton.click(); //delete becomes confirm.
    await waitFor('successMessage', 'className')
    resolve()
  })
}

function addNewUser(role){
  return new Promise(async resolve => {
    let createNewUser = await driver.findElement(By.id('createNewUser'))
    await isClickable(createNewUser, 'createNewUser')
    await createNewUser.click()
    await driver.findElement(By.id('userName')).sendKeys('Unit Test New User')
    await driver.findElement(By.id('email')).sendKeys('unitTesting@newUser.com')
    await driver.findElement(By.id('newUserRole')).click();
    await driver.findElement(By.id(`new${role}Select`)).click();
    await driver.findElement(By.id('password')).sendKeys(rightPassword);
    let confirmpassword = await driver.findElement(By.id('confirmPassword'))
    confirmpassword.sendKeys(wrongPassword);
    verifyText(await getErrorText(), `Passwords do not match!`)
    confirmpassword.clear();
    confirmpassword.sendKeys(rightPassword);
    await driver.findElement(By.id('login')).click();
    await waitFor('unitTesting@newUser.com')
    resolve()
  })
}

function addMeal(calories){
  return new Promise(async resolve => {
    await driver.findElement(By.id('enterDescription')).sendKeys('Testing Description');
    await driver.findElement(By.id('enterCalories')).sendKeys(calories);
    let enterMinutes = await driver.findElement(By.id('enterMinutes')).getAttribute('value')
    if(enterMinutes === '0'){ //This keeps popping up...
      await enterMinutes.clear()
      await enterMinutes.sendKeys('1')
      console.log('changed the minutes of the meal. Test results may be scewed.')
    }
    await driver.findElement(By.id('confirmConsumption')).click()
    resolve()
  })
}

function deleteMeal(){
  return new Promise(async resolve => {
    await (await driver.findElements(By.className('calorieTableDisplay')))[0].click()
    let deleteMealButton = await (await driver.findElements(By.className('deleteMealButton')))[0];
    await deleteMealButton.click()
    await deleteMealButton.click() //confirm is the same button.
    resolve()
  })
}

function searchArrowsTest(index){ //assumes two items displaying and maxDisplayInput is = 1
  return new Promise(async (resolve, reject) => {
    component = 'searchArrowsTest'
    let elementsIdx = role === 'regular' ? 0 : index;
    let maxDisplayInput = await (await driver.findElements(By.className('maxDisplayInput')))[elementsIdx]
    await maxDisplayInput.clear()
    await maxDisplayInput.sendKeys(index ? '1' : '2', Key.ENTER)
    let faSearch = await (await driver.findElements(By.className('fa-search')))[elementsIdx]
    await faSearch.click()
    if(index){//is 1
      await addMeal('1');
      await waitFor('overAte', 'className');
    } else {
      await (await driver.findElements(By.className('searchInput')))[index].sendKeys('Unit', Key.ENTER)
    }

    let forward = await (await driver.findElements(By.className('forward')))[elementsIdx]
    await forward.click()
    await inputDisabled('forward', elementsIdx)
    if(index) {
      await waitFor('overAte', 'className');
      verifyText(
        await (await driver.findElements(By.className('calorieTableDisplay')))[0].getText(),
        '1'
      )
    } else{
      verifyText(
        await (await driver.findElements(By.className('userName')))[0].getText(),
        role === 'manager' ? 'Unit Testing Manager (You)' : 'Unit Testing Manager' //If these accounts ever get deleted, be sure to add the manager account first.
      )
    }
    let backward = await (await driver.findElements(By.className('backward')))[elementsIdx]
    await backward.click()
    await inputDisabled('backward', elementsIdx)
    if(index){
      verifyText(
        await (await driver.findElements(By.className('calorieTableDisplay')))[0].getText(),
        '2002'
      )
      await waitFor('overAte', 'className');
      await deleteMeal()
      await waitFor('underAte', 'className');
    } else {
      verifyText(
        await (await driver.findElements(By.className('userName')))[0].getText(),
        'Unit Testing Regular' //Should always be first.
      )
    }
    resolve();
  })
}

function isClickable(element, name){
  return new Promise(async resolve => {
    await driver.wait( //We were having trouble with the modal covering the button. This seems to do the trick. :/
      until.elementIsEnabled(element),
      5000,
      `'${name}' never became enabled`
    );
    await driver.wait(
      until.elementIsVisible(element),
      5000,
      `'${name}' never became visible`
    );
    driver.sleep(1000)//And then it still didn't work!
    resolve()
  })
}

function inputDisabled(className, index){ //assumes two items displaying and maxDisplayInput is = 1
  return new Promise(async (resolve) => {
    await driver.wait(
      until.elementIsDisabled(await (await driver.findElements(By.className(className)))[index]),
      2000,
      `${className} never became disabled`
    );
    resolve()
  })
}

function changeDateField(className, newText){
  return new Promise(async resolve => {
    let parentDiv = await (await driver.findElements(By.className(className)))[0]
    await parentDiv.click();

    await waitFor('editableInput', 'className');
    let parentDivInput = await (await driver.findElements(By.className('editableInput')))[0];
    await parentDivInput.clear();
    await parentDivInput.sendKeys(newText, Key.ENTER)
    resolve()
  })
}

function verifyText(base, compare){
  if(base !== compare){
    console.log(component, `Expected "${compare}". ${base ? `Appeared as "${base}"` : 'Text was missing'}`)
  }
}

function waitFor(idString, byWhat, missing){ //missing isn't actually used, but we'll keep it around for now.
  byWhat = byWhat || 'id'
  return new Promise(async (resolve, reject) => {
    try{
      await driver.wait(
        until[missing ? 'stalenessOf' : 'elementLocated'](By[byWhat](idString)),
        5000,
        `An element with the ${byWhat}, "${idString}", did not appear.`
      );
      resolve()
    } catch(e){
      if(missing) resolve(); //It never existed in the first place.
      else reject(console.log(e.message, 'waitFor', idString, byWhat))
    }
  })
}

function getErrorText(){
  return new Promise(async resolve => {
    await waitFor('errorMessage', 'className')
    resolve(await ((await driver.findElements(By.className('errorMessage')))[0]).getText())
  })
}

function getSuccessText(){
  return new Promise(async resolve => {
    await waitFor('successMessage', 'className')
    resolve(await ((await driver.findElements(By.className('successMessage')))[0]).getText())
  })
}
