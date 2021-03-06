import { Component, OnInit } from "@angular/core";
import * as moment from "moment";
import { SalesDataService } from "src/app/services/sales-data.service";
import { LINE_CHART_COLORS } from "../../shared/chart.colors";

// const LINE_CHART_SAMPLE_DATA: any[] = [
//   { data: [35, 56, 33, 27, 78, 60], label: 'Sentiment Analysis' },
//   { data: [47, 50, 22, 11, 44, 67], label: 'Image Recognition' },
//   { data: [20, 11, 47, 89, 70, 55], label: 'Forecasting' },

// ];
// const LINE_CHART_LABELS: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June'];

@Component({
  selector: "app-line-chart",
  templateUrl: "./line-chart.component.html",
  styleUrls: ["./line-chart.component.css"]
})
export class LineChartComponent implements OnInit {
  constructor(private _salesDataService: SalesDataService) {}

  topCustomers: string[];
  allOrders: any[];

  lineChartData: any;
  lineChartLabels: any;
  lineChartOptions: any = {
    responsive: true
  };

  lineChartLegend: true;
  lineChartType = "line";
  lineChartColors = LINE_CHART_COLORS;

  ngOnInit() {
    this._salesDataService.getOrders(1, 100).subscribe(res => {
      this.allOrders = res["page"]["data"];

      this._salesDataService.getOrdersByCustomer(3).subscribe(cus => {
        this.topCustomers = cus.map(x => x["name"]);

        const allChartData = this.topCustomers.reduce((result, i) => {
          result.push(this.getChartData(this.allOrders, i));
          return result;
        }, []);

        let dates = allChartData
          .map(x => x["data"])
          .reduce((a, i) => {
            a.push(i.map(o => new Date(o[0])));
            return a;
          }, []);
        // console.log("dates:", dates);

        dates = [].concat.apply([], dates);
        // console.log("dates:", dates);

        const r = this.getCustomerOrdersByDate(allChartData, dates)["data"];
        // console.log("r:", r);

        this.lineChartLabels = r[0]["orders"].map(o => o["date"]);
        this.lineChartData = [
          {
            data: r[0].orders.map(x => x.total),
            label: r[0]["customer"]
          },
          {
            data: r[1].orders.map(x => x.total),
            label: r[1]["customer"]
          },
          { data: r[2].orders.map(x => x.total), label: r[2]["customer"] }
        ];
      });
    });
  }

  getChartData(allOrders: any, name: string) {
    const customerOrders = allOrders.filter(o => o.customer.name === name);
    //console.log("name:", name, "customerOrders:", customerOrders);

    const formattedOrders = customerOrders.reduce((r, e) => {
      r.push([e.placed, e.total]);
      return r;
    }, []);

    // console.log("formattedOrders:", formattedOrders);
    const result = { customer: name, data: formattedOrders };
    return result;
  }

  getCustomerOrdersByDate(orders: any, dates: any) {
    //for each customer -> for each date =>
    // {data: [{ 'customer': 'XYZ', 'orders': [{'date': '17-11-25', total:2421}]}, {}, {} []]}
    const customers = this.topCustomers;
    const prettyDates = dates.map(x => this.toFriendlyDate(x));
    const u = Array.from(new Set(prettyDates)).sort();
    //    console.log(u);

    //define our result  object to return
    const result = {};
    const datasets = (result["data"] = []);

    customers.reduce((x, y, i) => {
      // console.log("reducing :", y, "at index:", i);
      const customerOrders = [];
      datasets[i] = {
        customer: y,
        orders: u.reduce((r, e, j) => {
          const obj = {};
          obj["date"] = e;
          obj["total"] = this.getCustomerDateTotal(e, y); //sum total orders for this customer on this day
          customerOrders.push(obj);
          // console.log(
          //   "reducing :",
          //   e,
          //   "at index:",
          //   j,
          //   "customerOrders:",
          //   customerOrders
          // );
          return customerOrders;
        })
      };
      return x;
    }, []);

    return result;
  }

  toFriendlyDate(date: Date) {
    return moment(date)
      .endOf("day")
      .format("DD.MM.YYYY");
  }

  getCustomerDateTotal(date: any, customer: string) {
    const r = this.allOrders.filter(
      o =>
        o.customer.name === customer && this.toFriendlyDate(o.placed) === date
    );

    const result = r.reduce((a, b) => {
      return a + b.total;
    }, 0);

    return result;
  }
}
