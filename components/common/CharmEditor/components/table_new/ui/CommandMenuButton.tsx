// import cx from 'classnames';
import type { EditorState, Transaction } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import React from 'react';

import CommandMenu, { CommandMenuProps } from './CommandMenu';
import createPopUp from './createPopUp';
import { PopUpHandle } from './createPopUp';
import CustomButton from './CustomButton';
import uuid from './uuid';

import './czi-custom-menu-button.css';

class CommandMenuButton extends React.PureComponent<{
  className?: string | null;
  commandGroups: any[]; // Array<{ [string]: UICommand }>;
  disabled?: boolean | null;
  dispatch: (tr: Transaction) => void;
  editorState: EditorState;
  editorView?: EditorView;
  icon?: string | React.ReactNode | null;
  label?: string | React.ReactNode | null;
  title?: string;
}> {
  _menu: PopUpHandle | null = null;

  _id = uuid();

  state = {
    expanded: false
  };

  render() {
    const { className, label, commandGroups, editorState, editorView, icon, disabled, title } = this.props;
    const enabled =
      !disabled &&
      commandGroups.some((group, ii) => {
        return Object.keys(group).some((label) => {
          const command = group[label];
          let disabledVal = true;
          try {
            disabledVal = !editorView || !command.isEnabled(editorState, editorView);
          } catch (ex) {
            disabledVal = false;
          }
          return !disabledVal;
        });
      });

    const { expanded } = this.state;
    // const buttonClassName = cx(className, {
    //   'czi-custom-menu-button': true,
    //   expanded
    // });

    return (
      <CustomButton
        className='czi-custom-menu-button' // {buttonClassName}
        disabled={!enabled}
        icon={icon}
        id={this._id}
        label={label}
        onClick={this._onClick}
        title={title}
      />
    );
  }

  componentWillUnmount(): void {
    this._hideMenu();
  }

  _onClick = (): void => {
    const expanded = !this.state.expanded;
    this.setState({
      expanded
    });
    expanded ? this._showMenu() : this._hideMenu();
  };

  _hideMenu = (): void => {
    const menu = this._menu;
    this._menu = null;
    menu && menu.close();
  };

  _showMenu = (): void => {
    const menu = this._menu;
    const menuProps: CommandMenuProps = {
      ...this.props,
      onCommand: this._onCommand
    };
    if (menu) {
      menu.update(menuProps);
    } else {
      // @ts-ignore
      this._menu = createPopUp(CommandMenu, menuProps, {
        anchor: document.getElementById(this._id),
        onClose: this._onClose
      });
    }
  };

  _onCommand = (): void => {
    this.setState({ expanded: false });
    this._hideMenu();
  };

  _onClose = (): void => {
    if (this._menu) {
      this.setState({ expanded: false });
      this._menu = null;
    }
  };
}

export default CommandMenuButton;
