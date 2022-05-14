import React from 'react'

function GoToPrincipalPage(props){
    async function back(){
        window.location.href = "http://localhost:3000/"
    }
    return (
        <div>
            <button className={props.css} onClick={back}>Pagina principal</button>
        </div>
    )
}
export default GoToPrincipalPage;