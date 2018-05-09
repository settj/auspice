import React from "react";
import { updateVisibleTipsAndBranchThicknesses } from "../../actions/tree";
import Card from "../framework/card";
import Legend from "./legend/legend";
import PhyloTree from "./phyloTree/phyloTree";
import HoverInfoPanel from "./infoPanels/hover";
import TipClickedPanel from "./infoPanels/click";
import { changePhyloTreeViaPropsComparison } from "./reactD3Interface/change";
import * as callbacks from "./reactD3Interface/callbacks";
import { tabSingle, darkGrey, lightGrey } from "../../globalStyles";
import { renderTree } from "./reactD3Interface/initialRender";
import Tangle from "./tangle";

class Tree extends React.Component {
  constructor(props) {
    super(props);
    this.tangleRef = undefined;
    this.state = {
      hover: null,
      selectedBranch: null,
      selectedTip: null,
      tree: null,
      treeToo: null
    };
    /* bind callbacks */
    this.clearSelectedTip = callbacks.clearSelectedTip.bind(this);
    // this.handleIconClickHOF = callbacks.handleIconClickHOF.bind(this);
    this.redrawTree = () => {
      this.props.dispatch(updateVisibleTipsAndBranchThicknesses({
        root: [0, 0]
      }));
    };
  }
  componentDidMount() {
    if (this.props.tree.loaded) {
      const tree = new PhyloTree(this.props.tree.nodes, "LEFT");
      renderTree(this, true, tree, this.props);
      const newState = {tree};
      if (this.props.showTreeToo) {
        const treeToo = new PhyloTree(this.props.treeToo.nodes, "RIGHT");
        renderTree(this, false, treeToo, this.props);
        newState.treeToo = treeToo;
      }
      this.setState(newState);
    }
  }
  componentDidUpdate(prevProps) {
    let newState;
    let leftTreeUpdated;
    let rightTreeUpdated;
    let _; // eslint-disable-line

    if (this.state.tree) {
      [newState, leftTreeUpdated] = changePhyloTreeViaPropsComparison(true, this.state.tree, prevProps, this.props);
      if (prevProps.showTreeToo !== this.props.showTreeToo) {
        this.state.tree.change({svgHasChangedDimensions: true});
        if (this.props.showTreeToo) {
          if (this.state.treeToo) { /* remove the old tree */
            this.state.treeToo.clearSVG();
          }
          const treeToo = new PhyloTree(this.props.treeToo.nodes, "RIGHT");
          renderTree(this, false, treeToo, this.props);
          if (this.tangleRef) this.tangleRef.drawLines();
          this.setState({treeToo});
        } else {
          this.setState({treeToo: null});
        }
        return;
      }
    }
    /* tree too */
    if (this.state.treeToo) {
      if (!prevProps.showTreeToo && this.props.showTreeToo) {
        newState.treeToo = new PhyloTree(this.props.treeToo.nodes, "RIGHT");
        renderTree(this, false, newState.treeToo, this.props);
      } else if (!this.props.showTreeToo) {
        newState.treeToo = null;
      } else {
        [_, rightTreeUpdated] = changePhyloTreeViaPropsComparison(false, this.state.treeToo, prevProps, this.props);
      }
    }
    /* we may need to (imperitively) tell the tangle to redraw */
    if (this.tangleRef && (leftTreeUpdated || rightTreeUpdated)) {
      this.tangleRef.drawLines();
    }
    if (newState) this.setState(newState);
  }

  getStyles = () => {
    const activeResetTreeButton = this.props.tree.idxOfInViewRootNode !== 0
      || this.props.treeToo.idxOfInViewRootNode !== 0;
    return {
      resetTreeButton: {
        zIndex: 100,
        position: "absolute",
        right: 5,
        top: 0,
        cursor: activeResetTreeButton ? "pointer" : "auto",
        color: activeResetTreeButton ? darkGrey : lightGrey
      }
    };
  };

  renderTreeDiv({width, height, d3ref, viewerRef}) {
    return (
      <svg style={{pointerEvents: "auto"}}
        width={width}
        height={height}
      >
        <g
          id={"d3TreeElement"}
          width={width}
          height={height}
          style={{cursor: "default"}}
          ref={(c) => {this[d3ref] = c;}}
        />
      </svg>
    );
  }

  render() {
    const styles = this.getStyles();
    const spaceBetweenTrees = 100;
    const widthPerTree = this.props.showTreeToo ? (this.props.width - spaceBetweenTrees) / 2 : this.props.width;
    return (
      <Card center title={"Phylogeny"}>
        <Legend width={this.props.width}/>
        <HoverInfoPanel
          mutType={this.props.mutType}
          temporalConfidence={this.props.temporalConfidence.display}
          distanceMeasure={this.props.distanceMeasure}
          hovered={this.state.hovered}
          colorBy={this.props.colorBy}
          colorByConfidence={this.props.colorByConfidence}
          colorScale={this.props.colorScale}
          panelDims={{width: this.props.width, height: this.props.height, spaceBetweenTrees}}
        />
        <TipClickedPanel
          goAwayCallback={this.clearSelectedTip}
          tip={this.state.selectedTip}
          metadata={this.props.metadata}
        />
        {this.props.showTangle && this.state.tree && this.state.treeToo ? (
          <Tangle
            ref={(r) => {this.tangleRef = r;}}
            width={this.props.width}
            height={this.props.height}
            lookup={this.props.treeToo.tangleTipLookup}
            leftNodes={this.props.tree.nodes}
            rightNodes={this.props.treeToo.nodes}
            colors={this.props.tree.nodeColors}
            cVersion={this.props.tree.nodeColorsVersion}
            vVersion={this.props.tree.visibilityVersion}
            metric={this.props.distanceMeasure}
            spaceBetweenTrees={spaceBetweenTrees}
          />
        ) : null }
        {this.renderTreeDiv({width: widthPerTree, height: this.props.height, d3ref: "d3ref"})}
        {this.props.showTreeToo ? <div style={{width: spaceBetweenTrees}}/> : null}
        {this.props.showTreeToo ?
          this.renderTreeDiv({width: widthPerTree, height: this.props.height, d3ref: "d3refToo"}) :
          null
        }
        <button
          style={{...tabSingle, ...styles.resetTreeButton}}
          onClick={this.redrawTree}
        >
          reset layout
        </button>
      </Card>
    );
  }
}

export default Tree;