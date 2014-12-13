/* jshint devel:true */
(function(d3){
  'use strict';

  var app = {};

  app.height = d3.select('.graph').style('height');
  app.width = d3.select('.graph').style('width');
  app.selectedCountry = '';
  app.selectedCompany = undefined;
  app.showingCompany = undefined;

  app.svg = d3.selectAll('.graph')
              .append('svg').attr('width', app.width).attr('height', app.height);

  // app.svg.append('text')
  //   .classed('title', true)
  //   .text('Landen')
  //   .attr('y', 12);

  app.countries = app.svg.append('g')
    .classed('countries-menu', true);

  app.investmentsGroup = app.svg.append('g')
    .classed('investments', true);

  app.breakdowns = app.svg.append('g')
    .classed('breakdowns', true);

  app.companyBreakdowns = app.svg.append('g')
    .classed('investment-breakdowns', true);

  app.cleanUpData = function(data, countries){
    var cleanedData = {};
    cleanedData.items = [];
    cleanedData.countries = [];
    cleanedData.runningTotal = 0.0;

    // countries.forEach(function(d){
    //   if (cleanedData.countries.indexOf(d.Country) === -1){
    //     cleanedData.countries.push(d.Country);
    //   }
    // });

    cleanedData.countries = cleanedData.countries.sort();

    // clean up the data.
    var idx = 0;
    data.forEach(function(d, i){

      if (parseFloat(d.Total)){

        if (d.Parent === ''){
          d.Parent = data[i - 1].Parent;
        }

        var object = {
          total: parseFloat(d.Total),
          parent: d.Parent,
          investments: [],
          type: d.Investment,
          idx: idx
        };
        idx ++;

        cleanedData.runningTotal += parseFloat(d.Total);

        $.each(d, function(key, value){
          if (parseFloat(value)){
            object.investments.push({name: key, value: parseFloat(value)});
          }
        });

        countries.forEach(function(c){
          if (c.Investor === object.parent){
            object.country = c.Country;
            var checkIfExists = false;
            cleanedData.countries.forEach(function(di){
              console.log(c.Country, di)
              if (c.Country === di){
                checkIfExists = true;
                // console.log('it exists');
              }
            });
            if (!checkIfExists){
              cleanedData.countries.push({
                country: c.Country,
                total: d.total
              })
            }

          }
        });
        cleanedData.items.push(object);

      }
    });

    cleanedData.items.sort(function(a, b){
      return a.country > b.country ? 1 : -1;
    });
    console.log(cleanedData.countries)
    return cleanedData;
  };

  app.draw = function(){

    // var country = app.countries.selectAll('text.country')
    //   .data(app.cleanedData.countries);

    // country
    //   .classed('selected', function(d){ return d === app.selectedCountry; });

    // var enteringCountry = country.enter()
    //   .append('g');

    // enteringCountry
    //   .append('circle')
    //   .attr('cy', function(d, i){
    //     return 20 * i + 26;
    //   })
    //   .text(function(d){
    //     return d;
    //   })
    //   .attr('r', 3)
    //   .attr('cx', 5)
    //   .attr('fill', function(d){ return app.colorScale(d); });

    // enteringCountry
    //   .append('text')
    //   .classed('country', true)
    //   .attr('y', function(d, i){
    //     return 20 * i + 32;
    //   })
    //   .text(function(d){
    //     return d;
    //   })
    //   .attr('x', 15)
    //   .on('click', function(d){
    //     app.selectedCountry = d;
    //     app.draw(app.cleanedData);
    //   });

    var investment = app.investmentsGroup.selectAll('g')
      .data(app.cleanedData.items);

    investment.select('rect')
      .classed('selected', function(d){
        return d.country === app.selectedCountry;
      })
      .style('opacity', function(d){
        return d.country === app.selectedCountry ? 1 : 0.1;
      });

    var enteringInvestment = investment.enter()
      .append('g')
        .classed('company', true);

    enteringInvestment.append('rect')
      .attr('width', '100px')
      .attr('height', function(d, i){
        if (i > 0){
          var previousTotal = app.cleanedData.items[i - 1].precedingHeightPX;
          d.precedingHeightPX = app.yScale(d.total) + previousTotal;
        } else {
          d.precedingHeightPX = app.yScale(d.total);
        }
        return app.yScale(d.total);
      })
      .attr('x', '0px')
      .attr('y', function(d, i){
        if (i > 0){
          return app.cleanedData.items[i - 1].precedingHeightPX + 2;
        }
        return app.yScale(0);
      })
      .attr('fill', function(d){
        return app.colorScale(d.country);
      })
      .on('mouseover', function(d){
        d3.select(this.nextSibling).style('opacity', 1);
      })
      .on('mouseout', function(d){
        d3.select(this.nextSibling).style('opacity', 0);
      })
      .on('click', function(d){
        app.selectedCountry = d.country;
        app.selectedCompany = undefined;

        app.draw(app.cleanedData);
      })
    enteringInvestment
      .append('text')
        .text(function(d){ return d.country; })
        .attr('x', '110px')
        .attr('y', function(){
          var height = d3.select(this.previousSibling).attr('height');
          var y = d3.select(this.previousSibling).attr('y');
          return parseInt(y) + parseInt(height) / 2 + 6;
        })
        .style('opacity', 0);

    if (app.selectedCountry !== ''){

      var specificCountryData = app.cleanedData.items.filter(function(d){
        return d.country === app.selectedCountry;
      });

      var total = d3.sum(specificCountryData, function(d){ return d.total; });

      var breakdownScale = d3.scale.linear()
                          .domain([0, total])
                          .rangeRound([2, parseInt(app.height)]);

      var breakdown = app.breakdowns.selectAll('g')
        .data(specificCountryData, function(d) { return d.idx; });

      // update

      breakdown.select('rect')
        .classed('selected', function(d){
          return d.idx === app.selectedCompany.idx;
        })
        .style('opacity', function(d){
          return d.country === app.selectedCountry ? 1 : 0.1;
        });

      // entering

      var enteringBD = breakdown.enter()
        .append('g').classed('breakdown', true);

      enteringBD.append('rect')
        .attr('width', '100px')
        .attr('x', '250px')
        .attr('height', 0)
        .attr('y', 0)
        .on('mouseover', function(){
          d3.select(this.nextSibling).style('opacity', 1);
        })
        .on('mouseout', function(){
          d3.select(this.nextSibling).style('opacity', 0);
        })
        .on('click', function(d){
          app.selectedCompany = d;
          app.draw();
        })
        .transition()
          .duration(500)
          .attr('height', function(d, i){
            if (i > 0){
              var previousTotal = specificCountryData[i - 1].precedingHeightPX;
              d.precedingHeightPX = breakdownScale(d.total) + previousTotal;
            } else {
              d.precedingHeightPX = breakdownScale(d.total);
            }
            return breakdownScale(d.total) - 1;
          })
          .attr('y', function(d, i){
            if (i > 0){
              return specificCountryData[i - 1].precedingHeightPX + 1;
            }
            return breakdownScale(0);
          })
          .style('fill', function(d, i){
            var tempColor = d3.hsl(app.colorScale(d.country));
            if (i > specificCountryData.length){
              return tempColor.darker(i / specificCountryData.length * 2);
            } else {
              return tempColor.brighter(i / specificCountryData.length * 2);
            }
          })
          .each('end', function(){
            d3.select(this.parentNode).append('text')
              .text(function(d){ return d.parent; })
              .attr('x', '360px')
              .attr('y', function(){
                var height = d3.select(this.previousSibling).attr('height');
                var y = d3.select(this.previousSibling).attr('y');
                return parseInt(y) + parseInt(height) / 2 + 6;
              })
              .style('opacity', 0);
          });

      // remove
      breakdown.exit().remove();
    }

    if (app.selectedCompany){

      var investments = app.selectedCompany.investments.filter(function(d){
        return d.name !== 'Total';
      });

      var investmentsTotal = d3.sum(investments, function(d){
        return d.value;
      });

      var companyScale = d3.scale.linear()
                          .domain([0, investmentsTotal])
                          .rangeRound([2, parseInt(app.height)]);

      var investmentsNodes = app.companyBreakdowns.selectAll('g')
        .data(investments);

      // update

      investmentsNodes.select('rect')
        .transition()
          .duration(500)
            .attr('height', function(d, i){
              if (i > 0){
                var previousTotal = investments[i - 1].precedingHeightPX;
                d.precedingHeightPX = companyScale(d.value) + previousTotal;
              } else {
                d.precedingHeightPX = companyScale(d.value);
              }
              return companyScale(d.value) - 1;
            })
            .attr('y', function(d, i){
              if (i > 0){
                return investments[i - 1].precedingHeightPX;
              }
              return companyScale(0);
            });

      // entering

      var enteringInvestments = investmentsNodes.enter()
        .append('g').classed('investment-breakdown', true);

      enteringInvestments.append('rect')
        .attr('width', '100px')
        .attr('x', '500px')
        .attr('height', 0)
        .attr('y', 0)
        .on('mouseover', function(){
          d3.select(this.nextSibling).style('opacity', 1);
        })
        .on('mouseout', function(){
          d3.select(this.nextSibling).style('opacity', 0);
        })
        .on('click', function(d){
          app.showCompany = d;
          app.draw();
        })
        .transition()
          .duration(500)
          .attr('height', function(d, i){
            if (i > 0){
              var previousTotal = investments[i - 1].precedingHeightPX;
              d.precedingHeightPX = companyScale(d.value) + previousTotal;
            } else {
              d.precedingHeightPX = companyScale(d.value);
            }
            return companyScale(d.value) - 1;
          })
          .attr('y', function(d, i){
            if (i > 0){
              return investments[i - 1].precedingHeightPX;
            }
            return companyScale(0);
          })
          .style('fill', function(d, i){
            var tempColor = d3.hsl(app.colorScale(d.country));
            if (i > investments.length / 2){
              return tempColor.darker(i / investments.length);
            } else {
              return tempColor.brighter(i / investments.length);
            }
          })

          .each('end', function(){
            d3.select(this.parentNode).append('text')
              .text(function(d){ return d.name; })
              .attr('x', '610px')
              .attr('y', function(){
                var height = d3.select(this.previousSibling).attr('height');
                var y = d3.select(this.previousSibling).attr('y');
                return parseInt(y) + parseInt(height) / 2 + 6;
              })
              .style('opacity', 0);
          });

      // remove
      investmentsNodes.exit().remove();
    }

  };

  d3.csv('scripts/investments.csv', function(data){

    d3.csv('scripts/countries.csv', function(countries){
      app.cleanedData = app.cleanUpData(data, countries);

      app.yScale = d3.scale.linear()
                .domain([0, app.cleanedData.runningTotal])
                .rangeRound([4, parseInt(app.height)]);

      app.colorScale = d3.scale.ordinal()
                  .domain([app.cleanedData.countries])
                  .range(['hsl(0, 100%, 50%)',
                    'hsl(6.25, 100%, 50%)',
                    'hsl(12.5, 100%, 50%)',
                    'hsl(18.75, 100%, 50%)',
                    'hsl(25, 100%, 50%)',
                    'hsl(31.25, 100%, 50%)',
                    'hsl(37.5, 100%, 50%)']);

      app.draw();

    });
  });
}(d3));
