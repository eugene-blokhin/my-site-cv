const forceLayoutVisualize = function (csv) {
  // get the data
  d3.csv(csv).then((links) => {
    // contain data for nodes
    var nodes = {};
    // Compute the distinct nodes from the links.
    links.forEach((link) => {
      link.source =
        nodes[link.source] ||
        (nodes[link.source] = {
          name: link.source
        });
      // if link.source does not equal any of the nodes values, then
      // create a new element in the nodes object with the name of the link.source
      // value being considered
      link.target =
        nodes[link.target] ||
        (nodes[link.target] = {
          name: link.target,
          value: link.value
        });
      link.value = +link.value;
    });

    // set svg area
    var width = 300,
      height = 600;

    // use d3 force function
    var force = d3
      .forceSimulation(Object.values(nodes))
      //.nodes(Object.values(nodes)) // sets layout to array of nodes
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d, i) => {
            return i;
          })
          .distance(60)
          .strength(2.5)
      )
      .force("charge", d3.forceManyBody().strength(-350))
      .on("tick", tick); // runs the animation of the force layout

    // for varying link opacity
    var v = d3.scaleLinear().range([0, 100]);

    v.domain([
      0,
      d3.max(links, function (d) {
        return d.value;
      }),
    ]);

    Object.keys(nodes).forEach(function (nodeName) {
      const node = nodes[nodeName];
      if (v(node.value) <= 25) {
        node.type = "twofive";
      } else if (v(node.value) <= 50 && v(node.value) > 25) {
        node.type = "fivezero";
      } else if (v(node.value) <= 75 && v(node.value) > 50) {
        node.type = "sevenfive";
      } else if (v(node.value) <= 100 && v(node.value) > 75) {
        node.type = "onezerozero";
      }
    });

    /*
    links.forEach(function (link) {
      if (v(link.value) <= 25) {
        link.type = "twofive";
      } else if (v(link.value) <= 50 && v(link.value) > 25) {
        link.type = "fivezero";
      } else if (v(link.value) <= 75 && v(link.value) > 50) {
        link.type = "sevenfive";
      } else if (v(link.value) <= 100 && v(link.value) > 75) {
        link.type = "onezerozero";
      }
    });
    */

    // set up the svg container
    var svg = d3
      .select(".skills-graph")
      .append("svg")
      .attr("width", "100%")
      .attr("height", height);

    let updateForce = (e) => {
      var svgElem = document.getElementsByClassName("skills-graph")[0];
      var size = svgElem.getBoundingClientRect();
      let f = forceBoundary(0, 0, size.width, size.height);
      f.border = 10;
      f.strength = 1;
      force.force("boundary", f);
      force.force("center", d3.forceCenter(size.width / 2 , size.height / 2))
    };

    setTimeout(updateForce, 1000);
    window.addEventListener("resize", updateForce);

    // build the arrow.
    svg
      .append("svg:defs")
      .selectAll("marker")
      .data(["end"]) // Different link/path types can be defined here
      .enter()
      .append("svg:marker") // This section adds in the arrows
      .attr("id", String)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 15)
      .attr("refY", -1.5)
      .attr("markerWidth", 6) // set bounding box for the marker
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("svg:path")
      .attr("d", "M0,-5L10,0L0,5");

    // add the links and the arrows
    var path = svg
      .append("svg:g")
      .selectAll("path")
      .data(links)
      .enter()
      .append("svg:path")
      //    .attr("class", function(d) { return "link " + d.type; })
      .attr("class", function (d) {
        return "link " + d.type;
      })
      .attr("marker-end", "url(#end)");

    function dragStart(d) {
      if (!d.active) {
        force.alphaTarget(0.3).restart();
      }
      d.subject.fx = d.subject.x;
      d.subject.fy = d.subject.y;
    }

    function dragged(d) {
      d.subject.fx = d.x;
      d.subject.fy = d.y;
    }

    function dragEnd(d) {
      if (!d.active) force.alphaTarget(0);
      d.subject.fx = null;
      d.subject.fy = null;
    }

    // define the nodes
    var node = svg
      .selectAll(".node")
      .data(force.nodes())
      .enter()
      .append("g")
      .attr("class", function (d) {
        return "node " + d.type;
      })
      .call(
        d3
          .drag()
          .on("start", (d) => dragStart(d))
          .on("drag", (d) => dragged(d))
          .on("end", (d) => dragEnd(d))
      );
      //.on("click", click) // call click function
      //.on("dblclick", dblclick); // call dblclick function

    var color = d3.scaleOrdinal(d3.schemeCategory10);

    // add the nodes
    node
      .append("circle")
      .attr("r", 15);

    // add the text
    node
      .append("text")
      .attr("x", 20)
      .attr("dy", ".45em")
      .text(function (d) {
        return d.name;
      });

    // add the curvy lines
    function tick() {
      path.attr("d", (d) => {
        var dx = d.target.x - d.source.x,
          dy = d.target.y - d.source.y,
          dr = Math.sqrt(dx * dx + dy * dy);
        return (
          "M" +
          d.source.x +
          "," +
          d.source.y +
          "A" +
          dr +
          "," +
          dr +
          " 0 0,1 " +
          d.target.x +
          "," +
          d.target.y
        );
      });

      node.attr("transform", (d) => {
        return "translate(" + d.x + "," + d.y + ")";
      });
    }

    function click(event) {
      if (event.defaultPrevented) return; // dragged
      d3.select(this)
        .select("text")
        .transition()
        .duration(750)
        .attr("x", 22)
        .style("stroke", "orange")
        .style("stroke-width", ".5px")
        .style("font", "20px sans-serif");
      d3.select(this).select("circle").transition().duration(750).attr("r", 16);
    }

    function dblclick() {
      d3.select(this).select("circle").transition().duration(750).attr("r", 6);
      d3.select(this)
        .select("text")
        .transition()
        .style("stroke", "none")
        .style("stroke", "none")
        .style("font", "10px sans-serif");
    }
  });
};
