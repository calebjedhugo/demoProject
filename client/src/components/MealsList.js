import React, { Component } from 'react';
import {EntryField} from './EntryField.js';
import {MealsEntry} from './MealsEntry.js'
import {Search} from './Search.js';
import axios from 'axios';

//MealsList is called from CalorieTracker
export class MealsList extends Component {
  constructor(props){
    super(props);
    this.state = {
      sortedBy: '',
      data: [],
      fromDate: new Date(new Date(new Date().setHours(0,0,0,0)).setDate(-7)), //date from a week ago without the hours.
      toDate: new Date(new Date().setHours(0,0,0,0)), //today without the hours.
      fromTime: 0,
      toTime: 1439,//minutes in a day.
      error: '',
      max: 20,
      skip: 0,
      count: 0
    }
    this.calsPerDay = {};//Where we'll store key item pairs of date and calories
    this.updateList = this.updateList.bind(this)
  }

  componentDidMount(){
    this.updateList(); //init from database
  }

  componentDidUpdate(prevProps, prevState){
    if(prevProps.update !== this.props.update || //so meals entry can tell this when to refresh.
      prevProps.selectedId !== this.props.selectedId //Admin view needs to update when a different user is selected from UserList.
    ) {this.updateList()}
  }

  updateList(){
    this.setState({loading: true})
    axios({url: `meals/getMeals`,
      method: 'POST',
      data: { //We don't limit the query by time since we need that data to count each day's calories.
        fromDate: this.state.fromDate,
        toDate: this.state.toDate,
        _id: this.props.selectedId
      }
    }).then(res => {
      var data = res.data;
      this.calsPerDay = {};
      for(var i = 0; i < data.length; i++){ //Add up the calories for each day.
        if(this.calsPerDay[data[i].date]){
          this.calsPerDay[data[i].date] += data[i].calories;
        } else {
          this.calsPerDay[data[i].date] = data[i].calories;
        }
      }
      let truncated = data.length >= 999 ? 'Your date Filter is too broad.' : ''
      this.setState({data: data, error: truncated, count: data.length})
    }).catch(e => {
      this.setState({error: e.response ? e.response.data : e.message})
    }).finally(() => {this.setState({loading: false})})
  }

  get entryRows(){
    var entryArray = [];
    for(var i = this.state.skip; i < this.state.skip + this.state.max && i < this.state.count; i++){
      let elem = this.state.data[i]
      if(elem.time >= this.state.fromTime && elem.time <= this.state.toTime){ //filter display by time client side.
        entryArray.push(
          <Entry
            setLoading={bool => this.setState({loading: bool})}
            setModalContents={this.props.setModalContents}
            selectedId={this.props.selectedId}
            updateList={this.updateList}
            over={this.calsPerDay[elem.date] > this.props.parCalories}
            key={`${elem._id}${elem.description}${elem.calories}${elem.date}${elem.time}`}
            data={elem} _id={elem._id}
            fromDate={this.state.fromDate}
            toDate={this.state.toDate}/>)
      }
    }
    return entryArray;
  }

  render(){
    return (
      <div className={'mealsList'}>
        <h2 className={'header'}>{'Meals List'}</h2>
        <Filters
          setFromDate={value => {this.setState({fromDate: value}, this.updateList)}}
          fromDate={this.state.fromDate}
          setToDate={value => {this.setState({toDate: value}, this.updateList)}}
          toDate={this.state.toDate}
          setFromTime={value => {this.setState({fromTime: value})}} //setting this will trigger entryRows to refresh.
          fromTime={this.state.fromTime}
          setToTime={value => {this.setState({toTime: value})}} //setting this will trigger entryRows to refresh.
          toTime={this.state.toTime}
          updateList={this.updateList} />
        {this.entryRows.length ?
        <div className={'mealsTable'}>
          <div className='userListHeader'><Search
            loading={this.state.loading}
            skip={this.state.skip}
            count={this.state.count}
            max={this.state.max}
            setSkip={newSkip => {this.setState({skip: newSkip || 0})}}
            setMax={newMax => {
              newMax = Number(newMax);
              this.setState({
                skip: Math.floor(Number(this.state.skip) / newMax) * newMax,
                max: Number(newMax)})
              }
            }/></div>
          {this.state.error ? <div className='errorMessage'>{this.state.error}</div> : null}
          <table>
            <thead>
              <tr>
                <th>{'Description'}</th>
                <th>{'Calories'}</th>
                <th>{'Date'}</th>
                <th>{'Time'}</th>
              </tr>
            </thead>
            <tbody>
              {this.entryRows}
            </tbody>
          </table>
        </div> : <div id={'noMealsMessage'}>{'There are no meals in this date range.'}</div>}
      </div>
    )
  }
}

class Filters extends Component {
  constructor(props){
    super(props);
    this.state = {
      error: ''
    }
    this.newDate = this.newDate.bind(this);
  }
  get fromHours(){
    return Math.floor(this.props.fromTime / 60);
  }

  get toHours(){
    return Math.floor(this.props.toTime / 60);
  }

  get fromMinutes(){
    return this.props.fromTime % 60;
  }

  get toMinutes(){
    return this.props.toTime % 60;
  }

  get fromDate(){
    return this.props.fromDate.getDate();
  }

  get toDate(){
    return this.props.toDate.getDate();
  }

  get fromMonth(){
    return this.props.fromDate.getMonth() + 1;
  }

  get toMonth(){
    return this.props.toDate.getMonth() + 1;
  }

  get fromYear(){
    return this.props.fromDate.getFullYear();
  }

  get toYear(){
    return this.props.toDate.getFullYear();
  }

  //If the new date is no good, return the old date with an error.
  newDate(dateString, oldDate){
    var theDate;
    var e = () => {
      this.setState({error: 'Invalid Date'})
      return oldDate
    }

    try{
      theDate = new Date(dateString);
      if(theDate.toString() === 'Invalid Date'){
        return e()
      }
      this.setState({error: ''})
      return theDate;
    } catch(e){
      console.log(e.message)
      return e();
    }
  }

  //If the new time is no good, return the old time with an error.
  newTime(hours, minutes, oldTime){
    var theTime
    var e = () => {
      this.setState({error: 'Invalid Time'});
      return oldTime;
    }

    try{
      theTime = (Number(hours) * 60) + Number(minutes);
      if(theTime < 0 || theTime > 1439){
        return e();
      }
      this.setState({error: ''})
      return theTime;
    } catch(e){
      console.log(e.message);
      return e();
    }
  }

  render(){ //todo: make to and from share code. (very very low priority.)
    return (
      <div className='filters'>
        <span className='smallLabel'>{'Filter by Date'}</span>
        <table>
          <tbody>
            <tr>
              <td>{'From'}</td>
              <td><EntryField min='1' max='12' type={'number'} submit={value => {
                  this.props.setFromDate(this.newDate(`${value}/${this.fromDate}/${this.fromYear}`, this.props.fromDate))
                }} maxLength={2} value={this.fromMonth} /></td>
              <td>{'/'}</td>
              <td><EntryField min='1' max='31' type={'number'} submit={value => {
                  this.props.setFromDate(this.newDate(`${this.fromMonth}/${value}/${this.fromYear}`, this.props.fromDate))
                }} maxLength={2} value={this.fromDate} /></td>
              <td>{'/'}</td>
              <td><EntryField min='1900' max='9999' type={'number'} submit={value => {
                  this.props.setFromDate(this.newDate(`${this.fromMonth}/${this.fromDate}/${value}`, this.props.fromDate))
                }} maxLength={4} value={this.fromYear} className={'fromYear'}/></td>
              <td className={'space'}></td>
              <td><EntryField min='0' max='23' type={'number'} submit={value => {
                this.props.setFromTime(this.newTime(value, this.fromMinutes, this.props.fromTime))
              }} maxLength={2} value={this.fromHours < 10 ? `0${this.fromHours}` : this.fromHours} /></td>
              <td>{':'}</td>
              <td><EntryField min='1' max='60' type={'number'} submit={value => {
                this.props.setFromTime(this.newTime(this.fromHours, value, this.props.fromTime))
              }} maxLength={2} value={this.fromMinutes < 10 ? `0${this.fromMinutes}` : this.fromMinutes} /></td>
            </tr>
            <tr>
              <td>{'To'}</td>
              <td><EntryField min='1' max='12' type={'number'} submit={value => {
                  this.props.setToDate(this.newDate(`${value}/${this.toDate}/${this.toYear}`, this.props.toDate))
                }} maxLength={2} value={this.toMonth} /></td>
              <td>{'/'}</td>
              <td><EntryField min='1' max='31' type={'number'} submit={value => {
                  this.props.setToDate(this.newDate(`${this.toMonth}/${value}/${this.toYear}`, this.props.toDate))
                }} maxLength={2} value={this.toDate} /></td>
              <td>{'/'}</td>
              <td><EntryField min='1900' max='9999' type={'number'} submit={value => {
                  this.props.setToDate(this.newDate(`${this.toMonth}/${this.toDate}/${value}`, this.props.toDate))
                }} maxLength={4} value={this.toYear} /></td>
              <td className={'space'}></td>
              <td><EntryField min='0' max='23' type={'number'} submit={value => {
                this.props.setToTime(this.newTime(value, this.toMinutes, this.props.toTime))
              }} maxLength={2} value={this.toHours < 10 ? `0${this.toHours}` : this.toHours} /></td>
              <td>{':'}</td>
              <td><EntryField min='1' max='60' type={'number'} submit={value => {
                this.props.setToTime(this.newTime(this.toHours, value, this.props.toTime))
              }} maxLength={2} value={this.toMinutes < 10 ? `0${this.toMinutes}` : this.toMinutes} /></td>
            </tr>
            {this.state.error ? <tr><td colSpan='10'><div className={'errorMessage'}>{this.state.error}</div></td></tr> : null}
          </tbody>
        </table>
      </div>
    )
  }
}

class Entry extends Component {
  constructor(props){
    super(props)
    this.state = {
      deleting: false,
      deleted: false,
      description: this.props.data.description,
      calories: this.props.data.calories,
      time: this.props.data.time,
      date: new Date(this.props.data.date),
      error: '',
      loading: false
    }
    this.deleteEntry = this.deleteEntry.bind(this)
  }

  get hours(){
    return Math.floor(Number(this.state.time) / 60);
  }

  get minutes(){
    return this.state.time % 60;
  }

  get date(){
    return this.state.date.getDate()
  }

  get month(){
    return this.state.date.getMonth() + 1
  }

  get year(){
    return this.state.date.getFullYear()
  }

  deleteEntry(){
    this.props.setLoading(true)
    this.setState({loading: true})
    axios({
      url: `meals/deleteMeal`,
      method: 'POST',
      data: {
          _id: this.props._id,
          userId: this.props.selectedId //We compare this with the jwt and the user's role to make sure they're allowed to edit this entry.
        }
      }).then(res => {
        this.setState({deleted: true})
        this.props.updateList(); //updateList will stop the loading wheel up top
    }).catch(e => {
      this.setState({error: e.response ? e.response.data : e.message})
    }).finally(() => this.setState({loading: false}))
  }

  render(){
    if(!this.props.data || this.state.deleted) return null;
    return(
      <React.Fragment>
        <tr className={this.props.over ? 'overAte' : 'underAte'} onClick={() => this.props.setModalContents(
          <MealsEntry
            loading={this.state.loading}
            fromDate={this.props.fromDate}
            toDate={this.props.toDate}
            selectedId={this.props.selectedId}
            description={this.state.description}
            calories={this.state.calories}
            month={this.month}
            date={this.date}
            year={this.year}
            minutes={this.minutes}
            hours={this.hours}
            deleteEntry={this.deleteEntry}
            editing={true}
            _id={this.props._id}
            updateMealsList={this.props.updateList}
            closeModal={() => this.props.setModalContents(null)} />
        )}>
          <td>{this.state.description}</td>
          <td className={'calorieTableDisplay'}>{this.state.calories}</td>
          <td>{`${this.month}/${this.date}/${this.year}`}</td>
          <td>{`${this.hours < 10 ? `0${this.hours}` : this.hours}:${this.minutes < 10 ? `0${this.minutes}` : this.minutes}`}</td>
        </tr>
        {this.state.error ? <tr><td colSpan='11'><div className={'errorMessage'}>{this.state.error}</div></td></tr> : null}
      </React.Fragment>
    )
  }
}
