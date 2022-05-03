import {
  BangleEditor as CoreBangleEditor,
  BangleEditorProps as CoreBangleEditorProps
} from '@bangle.dev/core';
import { Plugin } from '@bangle.dev/pm';
import { EditorViewContext } from '@bangle.dev/react';
import { nodeViewUpdateStore, useNodeViews } from '@bangle.dev/react/node-view-helpers';
import { objectUid } from '@bangle.dev/utils';
import React, { ReactNode, useEffect, useImperativeHandle, useRef, useState } from 'react';
import reactDOM from 'react-dom';
import { NodeView, NodeViewProps } from '@bangle.dev/core';

export type RenderNodeViewsFunction = (
  props: NodeViewProps & { children: React.ReactNode },
) => React.ReactNode;

interface PropsType {
  debugKey: string;
  nodeView: NodeView;
  renderNodeViews: RenderNodeViewsFunction;
  nodeViewUpdateStore: WeakMap<NodeView, () => void>;
}

interface StateType {
  nodeViewProps: NodeViewProps;
}

class NodeViewWrapper extends React.Component<PropsType, StateType> {
  update: () => void;
  attachToContentDOM: (reactElement: HTMLDivElement) => void;

  constructor(props: PropsType) {
    super(props);

    this.update = () => {
      this.setState((_state, props) => ({
        nodeViewProps: props.nodeView.getNodeViewProps(),
      }));
    };

    this.attachToContentDOM = (reactElement) => {
      if (!reactElement) {
        return;
      }
      const contentDOM = this.props.nodeView.contentDOM!;
      // Since we do not control how many times this callback is called
      // make sure it is not already mounted.
      if (!reactElement.contains(contentDOM)) {
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

    return (
      <span
        className="bangle-nv-child-container"
        ref={this.attachToContentDOM}
      />
    );
  }

  render() {
    const element = this.props.renderNodeViews({
      ...this.state.nodeViewProps,
      children: this.getChildren(),
    });
    if (!element) {
      throw new Error(
        `renderNodeView must handle rendering for node of type "${this.state.nodeViewProps.node.type.name}"`,
      );
    }
    return element;
  }
}

interface BangleEditorProps<PluginMetadata = any>
  extends CoreBangleEditorProps<PluginMetadata> {
  id?: string;
  children?: React.ReactNode;
  renderNodeViews?: RenderNodeViewsFunction;
  className?: string;
  style?: React.CSSProperties;
  onReady?: (editor: CoreBangleEditor<PluginMetadata>) => void;
  editorViewRef?: typeof useRef;
  // Components that should be placed underneath the editor
  placeholderComponent?: ReactNode
}

export const BangleEditor = React.forwardRef<
  CoreBangleEditor | undefined,
  BangleEditorProps
>(
  (
    {
      id,
      state,
      children,
      focusOnInit = true,
      pmViewOpts,
      renderNodeViews,
      className,
      style,
      onReady = () => {},
      placeholderComponent
    },
    ref,
  ) => {
    const renderRef = useRef<HTMLDivElement>(null);
    const onReadyRef = useRef(onReady);
    const editorViewPayloadRef = useRef({
      state,
      focusOnInit,
      pmViewOpts,
    });
    const [editor, setEditor] = useState<CoreBangleEditor>();
    const nodeViews = useNodeViews(renderRef);

    useImperativeHandle(
      ref,
      () => {
        return editor;
      },
      [editor],
    );

    useEffect(() => {
      const editor = new CoreBangleEditor(
        renderRef.current!,
        editorViewPayloadRef.current,
      );
      (editor.view as any)._updatePluginWatcher = updatePluginWatcher(editor);
      onReadyRef.current(editor);
      setEditor(editor);

      return () => {
        editor.destroy();
      };
    }, [ref]);

    if (nodeViews.length > 0 && renderNodeViews == null) {
      throw new Error(
        'When using nodeViews, you must provide renderNodeViews callback',
      );
    }

    return (
      <React.Fragment>
        <EditorViewContext.Provider value={editor?.view as any}>
          <div className="bangle-editor-core">
            {editor ? children : null}
            <div ref={renderRef} id={id} className={className} style={style} />
            {editor ? placeholderComponent : null}
          </div>
          {nodeViews.map((nodeView) => {
            return reactDOM.createPortal(
              <NodeViewWrapper
                debugKey={objectUid.get(nodeView)}
                nodeViewUpdateStore={nodeViewUpdateStore}
                nodeView={nodeView}
                renderNodeViews={renderNodeViews!}
              />,
              nodeView.containerDOM!,
              objectUid.get(nodeView),
            );
          })}
        </EditorViewContext.Provider>
      </React.Fragment>
    );
  },
);

const updatePluginWatcher = (editor: CoreBangleEditor) => {
  return (watcher: Plugin, remove = false) => {
    if (editor.destroyed) {
      return;
    }

    let state = editor.view.state;

    const newPlugins = remove
      ? state.plugins.filter((p) => p !== watcher)
      : [...state.plugins, watcher];

    state = state.reconfigure({
      plugins: newPlugins,
    });

    editor.view.updateState(state);
  };
};
