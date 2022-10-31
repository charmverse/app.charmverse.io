
export default `

  span.deletion {
    text-decoration: line-through;
  }

  .selected-insertion,
  .selected-deletion,
  .selected-format_change,
  .selected-block_change {
    background-color: var(--charmeditor-active);
  }

  .tag.selected-insertion,
  .member.selected-insertion,
  .tag.selected-deletion,
  .member.selected-deletion {
    background-color: var(--charmeditor-active);
    color: var(--cs-white-text);
  }

  .margin-box.track > div {
    padding: 10px;
  }

  .margin-box .track-title {
    font-weight: 700;
  }

  .margin-box .format-change-info {
    margin-bottom: 9px;
  }

  .margin-box .format-change-info b {
    font-weight: 700;
  }

  [data-track] {

  }

  [data-track]::before {
    content: '';
    position: absolute;
    border-left: 2px solid var(--background-dark);
    left: -8px;
    height: 24px;
  }

  li[data-track]::before {
    content: inherit;
  }


  li[data-track]::before,
  li [data-track]::before {
    left: -5px;
  }

  .track-ctas {
    display: none;
  }

  .track.active .track-ctas {
    display: block;
  }

  span[data-user] {
    border-color: rgba(0,119,190,1);
    text-decoration-color: rgba(0,119,190,1);
  }
  span.insertion {
    color: rgba(0,119,190,1);
  }
  .user-bg-aaa {
    background-color: rgba(0,119,190,0.2);
  }

`;
