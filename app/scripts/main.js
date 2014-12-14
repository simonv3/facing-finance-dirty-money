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
    .append('svg')
      .attr('width', app.width)
      .attr('height', app.height);

  // app.svg.append('text')
  //   .classed('title', true)
  //   .text('Landen')
  //   .attr('y', 12);

  app.countries = app.svg.append('g')
    .classed('countries', true);

  app.barchart = app.svg.append('g')
    .classed('barchart', true);

  app.countryText = app.svg.append('text')
    .classed('country-text', true);

  app.cleanUpData = function(data, countries, investments){
    var cleanedData = {
          countries: [],
          runningTotal: 0.0,
          dirtyCompanies: investments
        };

    countries.sort(function(a, b){
      return a.Country > b.Country ? 1 : -1;
    });

    // for each country
    countries.forEach(function(country){
      var countryObject;
      // find a country object and if it doesn't exist

      cleanedData.countries.forEach(function(c){
        if (c.name === country.Country){
          countryObject = c;
          countryObject.investors.push({name: country.Investor});
        }
      });

      // if country object doesn't exist, create a new one
      if (!countryObject){
        countryObject = {
          name: country.Country,
          investors: [{name: country.Investor}],
        };
        cleanedData.countries.push(countryObject);
      }
    });

    // clean up the data
    var investors = [];
    var previousInvestorIndex = 0;
    data.forEach(function(row, i){
      // if row.Parent isn't empty string, create a new object.
      if (row.Parent !== ''){
        var investor = {
          name: row.Parent,
          investments: [],
        };

        $.each(row, function(key, value){
          value = parseFloat(value);
          if (value && key !== 'Total'){
            investor.investments.push({ name: key, value: value });
          }
        });

        investors.push(investor);
        previousInvestorIndex = investors.length - 1;

      } else {
        // else we need to add it to the previous object.
        $.each(row, function(key, value){
          value = parseFloat(value);
          if (value && key !== 'Total'){
            // now check to see if the investment doesn't already exist in
            // investors[i - 1]; If it does, add the value.
            // if it doesn't, push it.
            var exists = false;
            investors[previousInvestorIndex].investments.forEach(function(d){
              if (key === d.name){
                exists = true;
                d.value += value;
              }
            });
            if (!exists){
              investors[investors.length - 1].investments
                .push({ name: key, value: value });
            }
          }
        });
      }

    });

    // loop through the data and find the parents with the appropriate country
    investors.forEach(function(investor, i){
      var investor,
          investmentsObject,
          type;

      if (!cleanedData.total){
        cleanedData.total = 0;
      }

      // find the appropriate country
      cleanedData.countries.forEach(function(country){
        if (!country.total){
          country.total = 0;
        }
        // find the approriate investor

        country.investors.forEach(function(countryInvestors){
          if (countryInvestors.name === investor.name){
            countryInvestors.investments = investor.investments;
            countryInvestors.total = d3.sum(investor.investments, (function(i){
              return i.value;
            }));

            country.total += countryInvestors.total;
            cleanedData.total += countryInvestors.total;
          }
        });
      });
    });

    return cleanedData;
  };

  app.draw = function(drawDefault){
    var countries = app.countries.selectAll('g.country')
      .data(app.cleanedData.countries);

    // updating

    countries.select('country');

    // entering

    var country = countries
        .enter()
      .append('g')
        .classed('country', true)
        .attr('transform', function(d, i){
          var x = 0;
          if (i === 0){
            d.boostX = app.xScale(d.total);
            x = app.xScale(0);
          } else {
            var previousTotal = app.cleanedData.countries[i - 1].boostX;
            d.boostX = app.xScale(d.total) + previousTotal;
            x = app.cleanedData.countries[i - 1].boostX;
          }
          return 'translate(' + x + ', 0)';
        });

    country
      .append('rect')
        .each(function(d){
          if (d.name == drawDefault){
            app.drawBarGraph(d);
          }
        })
        .attr('height', 50)
        .attr('width', function(d){
          return app.xScale(d.total) - 1;
        })
        .on('click', function(d){
          app.drawBarGraph(d);
        })
        .on('mouseover', function(d){
          // app.addClassToSelected(d, 'g.country', 'dimmed', true);
          d3.select(this.nextSibling).style('opacity', 1);
        }).on('mouseout', function(d){
          // app.addClassToSelected(d, 'g.country', 'dimmed', false);
          d3.select(this.nextSibling).style('opacity', 0);
        })
        .attr('fill', function(d){
          return app.colorScale(d.name);
        });

    country
      .append('text')
        .attr('y', 70)
        .text(function(d) { return d.name })
        .attr('x', function(d, i){
          // if (i > 4){
          //   return -d3.select(this)[0][0].clientWidth + app.xScale(d.total);
          // }
        })
        .style('opacity', 0)

  };

  app.drawBarGraph = function(d){

    // Do the selecting

    d3.selectAll('g.country')
      .classed('selected', false);
    app.addClassToSelected(d, 'g.country', 'selected', true);

    // Attach the text saying how much people give out
    app.countryText
      .text(function(){
        var nationaliteit = function(){ switch (d.name){
          case "België":
            return "Belgische";
            break;
          case "Duitsland":
            return "Duitse"
            break;
          case "Nederland":
            return "Nederlandse"
            break;
          case "Frankrijk":
            return "Franse"
            break;
          case "Italië":
            return "Italische"
            break;
          case "Verenigd Koningkrijk":
            return "Britse"
            break;
        }}
        return nationaliteit() + " banken steken zo'n " + Math.round(d.total) + " mln euro in 'dirty money' bedrijven"
      })
      .attr('y', 100)
      .style('font-size', '1.2rem');

    var investors,
        investor,
        enteringInvestor,
        barChartScale,
        maxTotal;

    maxTotal = d3.max(d.investors, function(d){ return d.total });

    barChartScale = d3.scale.linear()
      .domain([0, maxTotal])
      .rangeRound([0, 500]);

    investor = app.barchart.selectAll('g.investor')
      .data(d.investors, function(d){
        return d.name;
      });

    // updating

    // entering

    enteringInvestor = investor
        .enter()
      .append('g')
      .classed('investor', true)
        .attr('transform', function(d, i){
          var push = 140 + i * 70;
          return "translate(0, " + push + ")"
        })
        .attr('actual-value', function(d){ return d.total; })

    enteringInvestor
      .append('text')
        .attr('y', -6)
        .text(function(d){ return d.name })

    enteringInvestor
      .append('text')
        .attr('x', function(d){
          var actualValue = d3.select(this.parentNode).attr('actual-value')
          return barChartScale(actualValue) + 30;
        })
        .attr('y', 24)
        .text(function(d){
          return '€' + Math.round(d.total) + ' mln';
        })

    enteringInvestor.selectAll('g.investments')
      .data(function(d){ return d.investments; })
        .enter()
      .append('g')
        .classed('investment', true)
          .attr('actual-value', function(d) { return d.value })
          .append('rect')
            .attr('fill', function(d){ return app.companyColors(d.name); })
            .attr('y', 0)
            .attr('height', 40)
            .attr('x', 0)
            .attr('width', 0)
            .on('mouseover', function(d){
              app.addClassToSelected(d, 'g.investment', 'dimmed', true)
            })
            .on('mouseout', function(d){
              app.addClassToSelected(d, 'g.investment', 'dimmed', false)
            })
            .on('click', function(d){
              d3.selectAll('g.investment')
                .classed('clicked', false);
              d3.selectAll('g.investment')
                .filter(function(nestedD){
                  return nestedD.name === d.name;
                })
                .classed('clicked', true);

              d3.select('.company-overview h2').html(d.name);
              // TODO
              // find dirtyCompany in dirt
              var company = app.dirtyCompanies.filter(function(nestedD){
                return nestedD.name === d.name;
              })
              d3.select('.company-overview .text').html(company[0].description);
            })
            .transition()
              .duration(500)
              .attr('x', function(d, i) {
                var investments = d3
                  .select(this.parentNode.parentNode).data()[0].investments;

                if (i === 0){
                  // set the current boost
                  d.boostX = barChartScale(d.value) + 1;
                  return barChartScale(0);
                } else {
                  // calculate the current boost
                  var previousTotal = investments[i - 1].boostX + 1;
                  d.boostX = barChartScale(d.value) + previousTotal;
                  // use the previous boost.
                  return investments[i - 1].boostX;
                }
              })

              .attr('width', function(d) {
                return barChartScale(d.value)
              });



    investor.exit().remove();

  }

  app.addClassToSelected = function(datum, selector, className, value){
    d3.selectAll(selector)
      .filter(function(nestedD){
        return nestedD.name === datum.name;
      })
      .classed(className, value);
  }

  d3.csv('scripts/investments.csv', function(data){
    d3.json('scripts/descriptions.json', function(dirtyCompanies){
      d3.csv('scripts/countries.csv', function(countries){
        app.cleanedData = app.cleanUpData(data, countries);
        app.dirtyCompanies = dirtyCompanies;
        app.xScale = d3.scale.linear()
          .domain([0, app.cleanedData.total])
          .rangeRound([0, parseInt(app.width) - 0]);

        var countryList = app.cleanedData.countries.map(function(d){
          return d.name
        });

        var companyList = dirtyCompanies.map(function(d){
          return d.name
        });

        app.companyColors = d3.scale.ordinal()
          .domain(companyList)
          .range(['hsl(150, 100%, 25%)',
            'hsl(155, 100%, 30%)',
            'hsl(155, 100%, 35%)',
            'hsl(160, 100%, 40%)',
            'hsl(160, 100%, 45%)',
            'hsl(160, 100%, 50%)',
            'hsl(165, 100%, 55%)',
            'hsl(165, 100%, 25%)',
            'hsl(165, 100%, 30%)',
            'hsl(170, 100%, 35%)',
            'hsl(170, 100%, 40%)',
            'hsl(170, 100%, 45%)',
            'hsl(175, 100%, 50%)',
            'hsl(175, 100%, 55%)',
            'hsl(175, 100%, 25%)',
            'hsl(180, 100%, 30%)',
            'hsl(180, 100%, 35%)',
            'hsl(180, 100%, 40%)',
            'hsl(185, 100%, 45%)',
            'hsl(185, 100%, 50%)',
            'hsl(185, 100%, 55%)'])

        app.colorScale = d3.scale.ordinal()
          .domain(countryList)
          .range(['hsl(330, 100%, 35%)',
            'hsl(330, 100%, 40%)',
            'hsl(330, 100%, 45%)',
            'hsl(330, 100%, 50%)',
            'hsl(330, 100%, 55%)',
            'hsl(330, 100%, 60%)',
            'hsl(330, 100%, 65%)']);

        app.draw("België");

      });
    });
  });
}(d3));
