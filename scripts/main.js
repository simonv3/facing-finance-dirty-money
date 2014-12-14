!function(t){"use strict";var e={};e.height=t.select(".graph").style("height"),e.width=t.select(".graph").style("width"),e.selectedCountry="",e.selectedCompany=void 0,e.showingCompany=void 0,e.svg=t.selectAll(".graph").append("svg").attr("width",e.width).attr("height",e.height),e.graphTitle=e.svg.append("text").classed("title",!0).attr("y",20).text("Europeese banken gebruiken €65 miljard in spaarcenten om te investeren in deze bedrijven."),e.countries=e.svg.append("g").classed("countries",!0),e.barchart=e.svg.append("g").classed("barchart",!0),e.countryText=e.svg.append("text").classed("country-text",!0),e.cleanUpData=function(e,n,a){var r={countries:[],runningTotal:0,dirtyCompanies:a};n.sort(function(t,e){return t.Country>e.Country?1:-1}),n.forEach(function(t){var e;r.countries.forEach(function(n){n.name===t.Country&&(e=n,e.investors.push({name:t.Investor}))}),e||(e={name:t.Country,investors:[{name:t.Investor}]},r.countries.push(e))});var s=[],o=0;return e.forEach(function(t){if(""!==t.Parent){var e={name:t.Parent,investments:[]};$.each(t,function(t,n){n=parseFloat(n),n&&"Total"!==t&&e.investments.push({name:t,value:n})}),s.push(e),o=s.length-1}else $.each(t,function(t,e){if(e=parseFloat(e),e&&"Total"!==t){var n=!1;s[o].investments.forEach(function(a){t===a.name&&(n=!0,a.value+=e)}),n||s[s.length-1].investments.push({name:t,value:e})}})}),s.forEach(function(e){r.total||(r.total=0),r.countries.forEach(function(n){n.total||(n.total=0),n.investors.forEach(function(a){a.name===e.name&&(a.investments=e.investments,a.total=t.sum(e.investments,function(t){return t.value}),n.total+=a.total,r.total+=a.total)})})}),r},e.draw=function(n){var a=e.countries.selectAll("g.country").data(e.cleanedData.countries);a.select("country");var r=a.enter().append("g").classed("country",!0).attr("transform",function(t,n){var a=0;if(0===n)t.boostX=e.xScale(t.total),a=e.xScale(0);else{var r=e.cleanedData.countries[n-1].boostX;t.boostX=e.xScale(t.total)+r,a=e.cleanedData.countries[n-1].boostX}return"translate("+a+", 40)"});r.append("rect").each(function(t){t.name===n&&e.drawBarGraph(t)}).attr("height",50).attr("width",function(t){return e.xScale(t.total)-1}).on("click",function(t){e.drawBarGraph(t)}).on("mouseover",function(){t.select(this.nextSibling).style("opacity",1)}).on("mouseout",function(){t.select(this.nextSibling).style("opacity",0)}).attr("fill",function(t){return e.colorScale(t.name)}),r.append("text").attr("y",70).text(function(t){return t.name}).style("opacity",0)},e.drawBarGraph=function(n){t.selectAll("g.country").classed("selected",!1),e.addClassToSelected(n,"g.country","selected",!0),e.countryText.text(function(){var t=function(){switch(n.name){case"België":return"Belgische";case"Duitsland":return"Duitse";case"Nederland":return"Nederlandse";case"Frankrijk":return"Franse";case"Italië":return"Italische";case"Verenigd Koningkrijk":return"Britse"}};return t()+" banken steken zo'n "+e.commaSeparateNumber(Math.round(n.total))+" mln euro in 'dirty money' bedrijven:"}).attr("y",140).style("font-size","1.2rem");var a,r,s,o;o=t.max(n.investors,function(t){return t.total}),s=t.scale.linear().domain([0,o]).rangeRound([0,500]),a=e.barchart.selectAll("g.investor").data(n.investors,function(t){return t.name}),r=a.enter().append("g").classed("investor",!0).attr("transform",function(t,e){var n=180+70*e;return"translate(0, "+n+")"}).attr("actual-value",function(t){return t.total}),r.append("text").attr("y",-6).text(function(t){return t.name}),r.append("text").attr("x",function(){var e=t.select(this.parentNode).attr("actual-value");return s(e)+30}).attr("y",24).text(function(t){return"€"+Math.round(t.total)+" mln"}),r.selectAll("g.investments").data(function(t){return t.investments}).enter().append("g").classed("investment",!0).attr("actual-value",function(t){return t.value}).append("rect").attr("fill",function(t){return e.companyColors(t.name)}).attr("y",0).attr("height",40).attr("x",0).attr("width",0).on("mouseover",function(n){""===t.select(".company-overview .text").html()&&t.select(".company-overview h2").html(n.name),e.addClassToSelected(n,"g.investment","dimmed",!0)}).on("mouseout",function(n){""===t.select(".company-overview .text").html()&&t.select(".company-overview h2").html(""),e.addClassToSelected(n,"g.investment","dimmed",!1)}).on("click",function(n){t.selectAll("g.investment").classed("clicked",!1),t.selectAll("g.investment").filter(function(t){return t.name===n.name}).classed("clicked",!0),t.select(".company-overview h2").html(n.name);var a=e.dirtyCompanies.filter(function(t){return t.name===n.name});t.select(".company-overview .text").html(a[0].description)}).transition().duration(500).attr("x",function(e,n){var a=t.select(this.parentNode.parentNode).data()[0].investments;if(0===n)return e.boostX=s(e.value)+1,s(0);var r=a[n-1].boostX+1;return e.boostX=s(e.value)+r,a[n-1].boostX}).attr("width",function(t){return s(t.value)}),a.exit().remove()},e.addClassToSelected=function(e,n,a,r){t.selectAll(n).filter(function(t){return t.name===e.name}).classed(a,r)},e.commaSeparateNumber=function(t){for(;/(\d+)(\d{3})/.test(t.toString());)t=t.toString().replace(/(\d+)(\d{3})/,"$1,$2");return t},t.csv("scripts/investments.csv",function(n){t.json("scripts/descriptions.json",function(a){t.csv("scripts/countries.csv",function(r){e.cleanedData=e.cleanUpData(n,r),e.dirtyCompanies=a,e.xScale=t.scale.linear().domain([0,e.cleanedData.total]).rangeRound([0,parseInt(e.width)-0]);var s=e.cleanedData.countries.map(function(t){return t.name}),o=a.map(function(t){return t.name});e.companyColors=t.scale.ordinal().domain(o).range(["hsl(150, 100%, 25%)","hsl(155, 100%, 30%)","hsl(155, 100%, 35%)","hsl(160, 100%, 40%)","hsl(160, 100%, 45%)","hsl(160, 100%, 50%)","hsl(165, 100%, 55%)","hsl(165, 100%, 25%)","hsl(165, 100%, 30%)","hsl(170, 100%, 35%)","hsl(170, 100%, 40%)","hsl(170, 100%, 45%)","hsl(175, 100%, 50%)","hsl(175, 100%, 55%)","hsl(175, 100%, 25%)","hsl(180, 100%, 30%)","hsl(180, 100%, 35%)","hsl(180, 100%, 40%)","hsl(185, 100%, 45%)","hsl(185, 100%, 50%)","hsl(185, 100%, 55%)"]),e.colorScale=t.scale.ordinal().domain(s).range(["hsl(330, 100%, 35%)","hsl(330, 100%, 40%)","hsl(330, 100%, 45%)","hsl(330, 100%, 50%)","hsl(330, 100%, 55%)","hsl(330, 100%, 60%)","hsl(330, 100%, 65%)"]),e.draw("België")})})})}(d3);