import React, { Component } from "react";
import 'typeface-roboto';

export default class BookingList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      loaded: false,
      placeholder: "Loading"
    };
  }

  componentDidMount() {
    fetch("api/booking/")
        .then(response => {
          if (response.status > 400) {
            return this.setState(() => {
              return {placeholder: "Something went wrong!"};
            });
          }
          return response.json();
        })
        .then(data => {
          this.setState(() => {
            return {
              data: data.results,
              loaded: true
            };
          });
        });
  }

  render() {
    return (
        <ul>
          {console.log(this.state.data)}
          {this.state.data.map(booking => {
            return (
                <li key={booking.id}>
                  {booking.begin_date} -> {booking.end_date}: {booking.guest_name}
                </li>
            );
          })}
        </ul>
    );
  }
}
