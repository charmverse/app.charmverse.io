import React from 'react';

import type { NodeView, NodeViewProps } from 'components/common/CharmEditor/components/@bangle.dev/core/node-view';

export type RenderNodeViewsFunction = (props: NodeViewProps & { children: React.ReactNode }) => React.ReactNode;

interface PropsType {
  nodeView: NodeView;
  renderNodeViews: RenderNodeViewsFunction;
  nodeViewUpdateStore: WeakMap<NodeView, () => void>;
}

interface StateType {
  nodeViewProps: NodeViewProps;
}

class NodeViewWrapperClass extends React.Component<PropsType, StateType> {
  update: () => void;

  attachToContentDOM: (reactElement: HTMLDivElement) => void;

  constructor(props: PropsType) {
    super(props);
    this.update = () => {
      this.setState(() => ({
        nodeViewProps: props.nodeView.getNodeViewProps()
      }));
    };

    this.attachToContentDOM = (reactElement) => {
      if (!reactElement) {
        return;
      }
      const contentDOM = this.props.nodeView.contentDOM;
      // Since we do not control how many times this callback is called
      // make sure it is not already mounted.
      if (contentDOM && !reactElement.contains(contentDOM)) {
        // If contentDOM happens to be mounted to someone else
        // remove it from there.
        if (contentDOM.parentNode) {
          contentDOM.parentNode.removeChild(contentDOM);
        }
        reactElement.appendChild(contentDOM);
      }
    };
    // So that we can directly update the nodeView without the mess
    // of prop forwarding.
    // What about updating the wrong nodeView ?
    // It is okay because a nodeView and this ReactComponent will always
    // have a 1:1 mapping. This is guaranteed because you use `nodeView` instance
    // to generate a react key. See the usage of this component in ./ReactEditor.js
    props.nodeViewUpdateStore.set(props.nodeView, this.update);
    this.state = { nodeViewProps: this.props.nodeView.getNodeViewProps() };
  }

  getChildren() {
    if (!this.props.nodeView.contentDOM) {
      return null;
    }

    // if (this.state.nodeViewProps.node.isInline) {
    //   return (
    //     // The bangle-nv-content is needed to keep the content take space
    //     // or else browsers will collapse it, making it hard to type
    //     <span
    //       className="bangle-nv-child-container"
    //       ref={this.attachToContentDOM}
    //     />
    //   );
    // }

    return <div className='bangle-nv-child-container' ref={this.attachToContentDOM} />;
  }

  render() {
    const element = this.props.renderNodeViews({
      ...this.state.nodeViewProps,
      children: this.getChildren()
    });
    if (!element) {
      throw new Error(
        `renderNodeView must handle rendering for node of type "${this.state.nodeViewProps.node.type.name}"`
      );
    }
    return element;
  }
}

export const NodeViewWrapper = React.memo(NodeViewWrapperClass);
